use chrono::Utc;
use rusqlite::{Connection, Error};
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::database::Database;

#[derive(Serialize, Deserialize, Debug)]
pub struct FileContent {
    id: Option<i32>,
    content: Vec<u8>,
    file_id: i32,
    updated_at: String,
}

impl FileContent {
    fn new(file_id: i32, content: Vec<u8>, id: Option<i32>) -> Self {
        let current_time = Utc::now().to_rfc3339();

        Self {
            id,
            content,
            file_id,
            updated_at: String::from(&current_time),
        }
    }

    fn get(file_id: &i32, conn: &Connection) -> Result<Vec<u8>, Error> {
        let mut sql = conn.prepare("SELECT content FROM file_content WHERE file_id=?1")?;
        Ok(sql.query_row(&[&file_id], |row| -> Result<Vec<u8>, Error> {
            Ok(row.get(0)?)
        })?)
    }

    fn update(&self, conn: &Connection) -> Result<(), Error> {
        let sql = "INSERT INTO file_content (file_id, content, updated_at) VALUES (?1, ?2, ?3) \
                         ON CONFLICT(file_id) \
                         DO UPDATE SET content=?2, updated_at=?3";

        conn.execute(sql, (&self.file_id, &self.content, &self.updated_at))?;

        Ok(())
    }
}

#[tauri::command]
pub fn update_content(
    file_id: i32,
    content: Vec<u8>,
    database: State<Database>,
) -> Option<bool> {
    let content = FileContent::new(file_id, content, None);

    match content.update(&database.get_connection()) {
        Ok(_) => Some(true),
        Err(e) => {
            eprintln!("[FileContent] Failed to update! {}", e);
            Some(false)
        }
    }
}

#[tauri::command]
pub fn get_content(
    file_id: i32,
    database: State<Database>,
) -> Option<Vec<u8>> {
    match FileContent::get(&file_id, &database.get_connection()) {
        Ok(content) => Some(content),
        Err(e) => {
            eprintln!("[FileContent] Failed to fetch! {}", e);
            None
        }
    }
}
