use chrono::Utc;
use rusqlite::{Connection, Error};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct Updates {
    pub id: Option<i64>,
    pub content: Vec<u8>,
    pub file_uid: String,
    pub updated_at: String,
    pub snapshot_id: i64,
}

impl Updates {
    pub fn new(file_uid: String, content: Vec<u8>, id: Option<i64>, snapshot_id: i64) -> Self {
        let current_time = Utc::now().to_rfc3339();

        Self {
            id,
            content,
            file_uid,
            updated_at: String::from(&current_time),
            snapshot_id,
        }
    }

    pub fn get(file_uid: &str, snapshot_id: i64, conn: &Connection) -> Result<Vec<Vec<u8>>, Error> {
        let mut files_sql = conn.prepare("SELECT id FROM files WHERE uid = ?1")?;
        let file_id = files_sql.query_row(&[&file_uid], |row| -> Result<i32, Error> {
            Ok(row.get(0)?)
        })?;

        let mut sql =
            conn.prepare("SELECT content FROM updates WHERE file_id=?1 AND snapshot_id=?2")?;

        let updates_iter = sql.query_map([&file_id, &(snapshot_id as i32)], |row| {
            let row: Vec<u8> = row.get(0)?;
            Ok(row)
        })?;

        let updates: Vec<Vec<u8>> = updates_iter
            .map(|result| result.expect("[Updates] Error while mapping rows"))
            .collect();

        Ok(updates)
    }

    pub fn get_by_id(id: i64, conn: &Connection) -> Result<Updates, Error> {
        let mut sql = conn.prepare(
            "SELECT u.content, u.snapshot_id, f.uid, u.updated_at, u.id from updates u INNER JOIN files f on f.id = u.file_id WHERE u.id=?1",
        )?;

        sql.query_row(&[&id], |row| -> Result<Updates, Error> {
            let update = Updates {
                content: row.get(0)?,
                snapshot_id: row.get(1)?,
                file_uid: row.get(2)?,
                updated_at: row.get(3)?,
                id: row.get(4)?,
            };

            Ok(update)
        })
    }

    pub fn insert(&self, conn: &Connection) -> Result<(), Error> {
        let mut files_sql = conn.prepare("SELECT id FROM files WHERE uid = ?1")?;
        let file_id = files_sql.query_row(&[&self.file_uid], |row| -> Result<i32, Error> {
            Ok(row.get(0)?)
        })?;

        let sql = "INSERT INTO updates (file_id, content, updated_at, snapshot_id) VALUES (?1, ?2, ?3, ?4)";
        conn.execute(
            sql,
            (&file_id, &self.content, &self.updated_at, &self.snapshot_id),
        )?;

        Ok(())
    }
}
