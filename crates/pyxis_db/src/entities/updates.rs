use chrono::Utc;
use rusqlite::{Connection, Error};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct Updates {
    pub id: Option<i64>,
    pub content: Vec<u8>,
    pub file_id: i64,
    pub updated_at: String,
    pub snapshot_id: i64,
}

impl Updates {
    pub fn new(file_id: i64, content: Vec<u8>, id: Option<i64>, snapshot_id: i64) -> Self {
        let current_time = Utc::now().to_rfc3339();

        Self {
            id,
            content,
            file_id,
            updated_at: String::from(&current_time),
            snapshot_id,
        }
    }

    pub fn get(file_id: &i64, snapshot_id: &i64, conn: &Connection) -> Result<Vec<Vec<u8>>, Error> {
        let mut sql =
            conn.prepare("SELECT content FROM updates WHERE file_id=?1 AND snapshot_id=?2")?;
        let updates_iter = sql.query_map([&file_id, &snapshot_id], |row| {
            let row: Vec<u8> = row.get(0)?;
            Ok(row)
        })?;

        let updates: Vec<Vec<u8>> = updates_iter
            .map(|result| result.expect("[Updates] Error while mapping rows"))
            .collect();

        Ok(updates)
    }

    pub fn insert(&self, conn: &Connection) -> Result<(), Error> {
        let sql = "INSERT INTO updates (file_id, content, updated_at, snapshot_id) VALUES (?1, ?2, ?3, ?4)";
        conn.execute(
            sql,
            (
                &self.file_id,
                &self.content,
                &self.updated_at,
                &self.snapshot_id,
            ),
        )?;

        Ok(())
    }
}
