use crate::database::Database;
use chrono::Utc;
use rusqlite::{Connection, Error};
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Serialize, Deserialize, Debug)]
pub struct Snapshots {
    id: Option<i32>,
    content: Vec<u8>,
    file_id: i32,
    updated_at: String,
    snapshot_id: i32
}

impl Snapshots {
    fn new(file_id: i32, content: Vec<u8>, id: Option<i32>, snapshot_id: i32) -> Self {
        let current_time = Utc::now().to_rfc3339();

        Self {
            id,
            content,
            file_id,
            updated_at: String::from(&current_time),
            snapshot_id
        }
    }

    fn get(file_id: &i32, conn: &Connection) -> Result<Snapshots, Error> {
        let mut sql = conn.prepare("SELECT content, snapshot_id, file_id, updated_at, id FROM snapshots WHERE file_id=?1")?;
        Ok(sql.query_row(&[&file_id], |row| -> Result<Snapshots, Error> {
            Ok(Snapshots {
                content: row.get(0)?,
                snapshot_id: row.get(1)?,
                file_id: row.get(2)?,
                updated_at: row.get(3)?,
                id: row.get(4)?
            })
        })?)
    }

    fn update(&self, conn: &Connection) -> Result<(), Error> {
        let sql = "INSERT INTO snapshots (file_id, content, updated_at, snapshot_id) VALUES (?1, ?2, ?3, ?4) \
                         ON CONFLICT(file_id) \
                         DO UPDATE SET content=?2, updated_at=?3, snapshot_id=snapshot_id+1";

        conn.execute(sql, (&self.file_id, &self.content, &self.updated_at, &self.snapshot_id))?;

        Ok(())
    }
}

#[tauri::command]
pub fn update_snapshot(file_id: i32, content: Vec<u8>, database: State<Database>) -> Option<bool> {
    let content = Snapshots::new(file_id, content, None, 1);

    match content.update(&database.get_connection()) {
        Ok(_) => Some(true),
        Err(e) => {
            eprintln!("[Snapshots] Failed to update! {}", e);
            Some(false)
        }
    }
}

#[tauri::command]
pub fn get_snapshot(file_id: i32, database: State<Database>) -> Option<Snapshots> {
    match Snapshots::get(&file_id, &database.get_connection()) {
        Ok(snapshot) => Some(snapshot),
        Err(e) => {
            eprintln!("[Snapshots] Failed to fetch! {}", e);
            None
        }
    }
}
