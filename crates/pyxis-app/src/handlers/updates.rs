use pyxis_db::{database::Database, entities::updates::Updates};
use tauri::State;

#[tauri::command]
pub fn insert_updates(
    file_id: i32,
    snapshot_id: i32,
    content: Vec<u8>,
    database: State<Database>,
) -> Option<bool> {
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
pub fn get_updates(
    file_id: i32,
    snapshot_id: i32,
    database: State<Database>,
) -> Option<Vec<Vec<u8>>> {
    match Updates::get(&file_id, &snapshot_id, &database.get_connection()) {
        Ok(content) => Some(content),
        Err(e) => {
            eprintln!("[Updates] Failed to fetch! {}", e);
            None
        }
    }
}
