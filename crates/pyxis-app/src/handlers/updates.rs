use pyxis_shared::{database::Database, entities::updates::Updates};
use tauri::State;

#[tauri::command]
pub fn insert_updates(
    file_uid: String,
    snapshot_id: i64,
    content: Vec<u8>,
    database: State<Database>,
) -> Option<bool> {
    let update = Updates::new(file_uid, content, None, snapshot_id);

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
    file_uid: String,
    snapshot_id: i64,
    database: State<Database>,
) -> Option<Vec<Vec<u8>>> {
    match Updates::get(&file_uid, snapshot_id, &database.get_connection()) {
        Ok(content) => Some(content),
        Err(e) => {
            eprintln!("[Updates] Failed to fetch! {}", e);
            None
        }
    }
}
