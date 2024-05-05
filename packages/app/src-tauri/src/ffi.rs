use super::reader::FileContent;
use super::workspace::store;

#[tauri::command]
pub fn read_store_config (path: String) -> FileContent {
    let store = store::Store(&path);
    store.get_config()
}
