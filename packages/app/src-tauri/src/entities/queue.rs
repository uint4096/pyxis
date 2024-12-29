use rusqlite::{Connection, Error};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct ListenerQueue {
    pub id: Option<i32>,
    pub status: String,
    pub source: String,
    pub operation: String,
    pub payload: String,
}

impl ListenerQueue {
    pub fn new(id: Option<i32>, status: String, source: String, operation: String, payload: String) -> Self {
        Self {
            id,
            status,
            source,
            operation,
            payload,
        }
    }

    pub fn enqueue(&self, conn: &Connection) -> Result<(), Error> {
        let insert_sql =
            "INSERT INTO listener_queue (status, source, operation, payload) VALUES (?1, ?2, ?3, ?4)";

        conn.execute(insert_sql, ("init", &self.source, &self.operation, &self.payload))?;

        Ok(())
    }

    pub fn dequeue(conn: &Connection) -> Result<ListenerQueue, Error> {
        let mut sql = conn.prepare(
            "SELECT id, status, source, operation, payload FROM listener_queue ORDER BY ROWID ASC LIMIT 1",
        )?;

        let entry = sql.query_row([], |row| -> Result<ListenerQueue, Error> {
            Ok(ListenerQueue {
                id: row.get(0)?,
                status: row.get(1)?,
                source: row.get(2)?,
                operation: row.get(3)?,
                payload: row.get(4)?,
            })
        })?;

        if let Some(id) = entry.id {
            let updated_count = conn.execute("UPDATE listener_queue SET status = 'picked' WHERE id=(?1)", (&id,))?;

            if updated_count != 0 {
                println!("Failed to dequeue! Already picked.");
                return Err(Error::QueryReturnedNoRows);
            }
        }

        Ok(entry)
    }

    pub fn remove(&self, conn: &Connection) -> Result<(), Error> {
        conn.execute("DELETE FROM listener_queue WHERE id=(?1)", (&self.id,))?;

        Ok(())
    }

    pub fn requeue(&self, conn: &Connection) -> Result<(), Error> {
        conn.execute("UPDATE listener_queue SET status = 'failed' WHERE id=(?1)", (&self.id,))?;

        Ok(())
    }
}
