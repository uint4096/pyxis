use pyxis_db::{database::Database, entities::snapshots::Snapshots};
use tauri::State;

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
