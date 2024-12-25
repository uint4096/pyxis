use crate::database::Database;
use chrono::Utc;
use rusqlite::{Connection, Error};
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Serialize, Deserialize, Debug)]
pub struct Updates {
    id: Option<i32>,
    content: Vec<u8>,
    file_id: i32,
    updated_at: String,
    snapshot_id: i32
}

impl Updates {
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

    fn get(file_id: &i32, snapshot_id: &i32, conn: &Connection) -> Result<Vec<Vec<u8>>, Error> {
        let mut sql = conn.prepare("SELECT content FROM updates WHERE file_id=?1 AND snapshot_id=?2")?;
        let updates_iter = sql.query_map([&file_id, &snapshot_id], |row| {
            let row: Vec<u8> = row.get(0)?;
            Ok(row)
        })?;

        let updates: Vec<Vec<u8>> = updates_iter
            .map(|result| result.expect("[Updates] Error while mapping rows"))
            .collect();

        Ok(updates)
    }

    fn insert(&self, conn: &Connection) -> Result<(), Error> {
        let sql = "INSERT INTO updates (file_id, content, updated_at, snapshot_id) VALUES (?1, ?2, ?3, ?4)";
        conn.execute(sql, (&self.file_id, &self.content, &self.updated_at, &self.snapshot_id))?;

        Ok(())
    }
}

#[tauri::command]
pub fn insert_updates(file_id: i32, snapshot_id: i32, content: Vec<u8>, database: State<Database>) -> Option<bool> {
    let update = Updates::new(file_id, content, None, snapshot_id);

    match update.insert(&database.get_connection()) {
        Ok(_) => Some(true),
        Err(e) => {
            eprintln!("[Updates] Failed to update! {}", e);
            Some(false)
        }
    }
}

#[tauri::command]
pub fn get_updates(file_id: i32, snapshot_id: i32, database: State<Database>) -> Option<Vec<Vec<u8>>> {
    match Updates::get(&file_id, &snapshot_id, &database.get_connection()) {
        Ok(content) => Some(content),
        Err(e) => {
            eprintln!("[Updates] Failed to fetch! {}", e);
            None
        }
    }
}
