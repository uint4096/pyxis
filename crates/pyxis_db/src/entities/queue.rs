use std::str::FromStr;

use rusqlite::{Connection, Error};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, PartialEq, Clone)]
pub enum Source {
    Workspace,
    Directory,
    File,
    Snapshot,
    Update,
}

impl FromStr for Source {
    type Err = ();

    fn from_str(input: &str) -> Result<Source, Self::Err> {
        match input {
            "workspaces" => Ok(Source::Workspace),
            "directories" => Ok(Source::Directory),
            "files" => Ok(Source::File),
            "snapshots" => Ok(Source::Snapshot),
            "updates" => Ok(Source::Update),
            _ => Err(()),
        }
    }
}

impl ToString for Source {
    fn to_string(&self) -> String {
        match self {
            Source::Workspace => String::from("workspaces"),
            Source::File => String::from("files"),
            Source::Directory => String::from("directories"),
            Source::Snapshot => String::from("snapshots"),
            Source::Update => String::from("updates"),
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ListenerQueue {
    pub id: Option<i32>,
    pub status: String,
    pub source: Source,
    pub operation: String,
    pub payload: String,
    pub file_id: Option<i64>,
    pub snapshot_id: Option<i64>,
}

impl ListenerQueue {
    pub fn new(
        id: Option<i32>,
        status: String,
        source: String,
        operation: String,
        payload: String,
        file_id: Option<i64>,
        snapshot_id: Option<i64>,
    ) -> Self {
        Self {
            id,
            status,
            source: Source::from_str(&source).expect("Failed to convert source from string"),
            operation,
            payload,
            file_id,
            snapshot_id,
        }
    }

    pub fn enqueue(&self, conn: &Connection) -> Result<(), Error> {
        let insert_sql =
            "INSERT INTO listener_queue (status, source, operation, payload, file_id, snapshot_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6)";

        conn.execute(
            insert_sql,
            (
                "init",
                &self.source.to_string(),
                &self.operation,
                &self.payload,
                &self.file_id,
                &self.snapshot_id,
            ),
        )?;

        Ok(())
    }

    pub fn dequeue(conn: &Connection) -> Result<ListenerQueue, Error> {
        let mut sql = conn.prepare(
            "SELECT id, status, source, operation, payload, file_id, snapshot_id payload FROM listener_queue WHERE status in ('failed', 'init') ORDER BY ROWID ASC LIMIT 1",
        )?;

        let entry = sql.query_row([], |row| -> Result<ListenerQueue, Error> {
            let source_str: String = row.get(2)?;
            let file_id: Option<i64> = row.get(5)?;
            let snapshot_id: Option<i64> = row.get(6)?;

            Ok(ListenerQueue {
                id: row.get(0)?,
                status: row.get(1)?,
                source: Source::from_str(&source_str)
                    .expect("Failed to convert source from string!"),
                operation: row.get(3)?,
                payload: row.get(4)?,
                file_id,
                snapshot_id,
            })
        })?;

        if let Some(id) = entry.id {
            let updated_count = conn.execute(
                "UPDATE listener_queue SET status = 'picked' WHERE id=(?1)",
                (&id,),
            )?;

            if updated_count == 0 {
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
        conn.execute(
            "UPDATE listener_queue SET status = 'failed' WHERE id=(?1)",
            (&self.id,),
        )?;

        Ok(())
    }
}
