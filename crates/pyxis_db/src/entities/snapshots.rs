use chrono::Utc;
use rusqlite::{Connection, Error};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct Snapshots {
    pub id: Option<i32>,
    pub content: Vec<u8>,
    pub file_uid: String,
    pub updated_at: String,
    pub snapshot_id: i32,
}

impl Snapshots {
    pub fn new(file_uid: String, content: Vec<u8>, id: Option<i32>, snapshot_id: i32) -> Self {
        let current_time = Utc::now().to_rfc3339();

        Self {
            id,
            content,
            file_uid,
            updated_at: String::from(&current_time),
            snapshot_id,
        }
    }

    pub fn get_by_id(connection: &Connection, id: i64) -> Result<Snapshots, Error> {
        let mut sql = connection.prepare(
            "SELECT s.content, s.snapshot_id, f.uid, s.updated_at, s.id FROM snapshots s INNER JOIN files f on f.id = s.file_id WHERE s.id=?1",
        )?;

        sql.query_row(&[&id], |row| -> Result<Snapshots, Error> {
            Ok(Snapshots {
                content: row.get(0)?,
                snapshot_id: row.get(1)?,
                file_uid: row.get(2)?,
                updated_at: row.get(3)?,
                id: row.get(4)?,
            })
        })
    }

    pub fn get(file_uid: &str, conn: &Connection) -> Result<Snapshots, Error> {
        let mut files_sql = conn.prepare("SELECT id FROM files WHERE uid = ?1")?;
        let file_id = files_sql.query_row(&[&file_uid], |row| -> Result<i32, Error> { Ok(row.get(0)?) })?;

        let mut sql = conn.prepare(
            "SELECT s.content, s.snapshot_id, f.uid, s.updated_at, s.id FROM snapshots s INNER JOIN files f on f.id = s.file_id WHERE s.file_id=?1",
        )?;

        sql.query_row(&[&file_id], |row| -> Result<Snapshots, Error> {
            Ok(Snapshots {
                content: row.get(0)?,
                snapshot_id: row.get(1)?,
                file_uid: row.get(2)?,
                updated_at: row.get(3)?,
                id: row.get(4)?,
            })
        })
    }

    pub fn update(&self, conn: &Connection) -> Result<(), Error> {
        let mut files_sql = conn.prepare("SELECT id FROM files WHERE uid = ?1")?;
        let file_id = files_sql.query_row(&[&self.file_uid], |row| -> Result<i32, Error> { Ok(row.get(0)?) })?;

        let sql = "INSERT INTO snapshots (file_id, content, updated_at, snapshot_id) VALUES (?1, ?2, ?3, ?4) \
                         ON CONFLICT(file_id) \
                         DO UPDATE SET content=?2, updated_at=?3, snapshot_id=snapshot_id+1";

        conn.execute(
            sql,
            (
                &file_id,
                &self.content,
                &self.updated_at,
                &self.snapshot_id,
            ),
        )?;

        Ok(())
    }
}
