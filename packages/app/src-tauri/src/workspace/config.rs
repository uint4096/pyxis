use crate::reader::{read_file, FileContent};
use tauri;

#[tauri::command]
pub fn read_config (path: String) -> FileContent {
    read_file(&path)   
}
