use crate::{
    config::system::SystemConfig,
    dir_reader::DirContent,
    document::{actions::Actions, dir::Directory, file::File},
};

use super::config::{
    configuration::Configuration,
    store::{Store, StoreConfig},
    system::System,
    workspaces::{Workspace, WorkspaceConfig},
};
use super::reader::FileContent;

#[tauri::command]
pub fn read_store_config(path: String) -> FileContent {
    let store = Store(&path);
    store.get_config()
}

#[tauri::command]
pub fn write_store_config(path: String, config: StoreConfig) -> bool {
    let store = Store(&path);
    store.save_config(config)
}

#[tauri::command]
pub fn read_workspace_config(path: String) -> FileContent {
    let workspace = Workspace(&path);
    workspace.get_config()
}

#[tauri::command]
pub fn read_workspace_tree(path: String) -> DirContent {
    let workspace = Workspace(&path);
    workspace.read_dir()
}

#[tauri::command]
pub fn write_workspace_config(path: String, config: WorkspaceConfig) -> bool {
    let workspace = Workspace(&path);
    workspace.save_config(config)
}

#[tauri::command]
pub fn read_system_config() -> FileContent {
    if let Some(home_dir) = dirs::home_dir() {
        let dir = home_dir.join(".config").join("pyxis");
        let system = System(
            &dir.to_str()
                .expect("[Config Error] Failed to convert dir to string!"),
        );
        system.get_config()
    } else {
        println!("[Config Error] Failed to retrieve home directory!");
        FileContent::new_failed()
    }
}

#[tauri::command]
pub fn write_system_config(config: SystemConfig) -> bool {
    if let Some(home_dir) = dirs::home_dir() {
        let dir = home_dir.join(".config").join("pyxis");
        let system = System(
            &dir.to_str()
                .expect("[Config Error] Failed to convert dir to string!"),
        );

        system.save_config(config)
    } else {
        println!("[Config Error] Failed to retrieve home directory!");
        false
    }
}

#[tauri::command]
pub fn _create_file(path: &str, file: File) -> bool {
    file.create(path)
}

#[tauri::command]
pub fn read_file(path: &str, file: File) -> FileContent {
    file.read(path)
}

#[tauri::command]
pub fn write_file(path: &str, file: File, content: &str) -> bool {
    file.write(path, content)
}

#[tauri::command]
pub fn rename_file(path: &str, file: File, new_name: &str) -> bool {
    file.rename(path, new_name)
}

#[tauri::command]
pub fn _delete_file(path: &str, file: File) -> bool {
    file.delete(path)
}

#[tauri::command]
pub fn create_directory(path: &str, dir: Directory) -> bool {
    dir.create(path)
}

#[tauri::command]
pub fn rename_dir(path: &str, dir: Directory, new_name: &str) -> bool {
    dir.rename(path, new_name)
}

#[tauri::command]
pub fn delete_directory(path: &str, dir: Directory) -> bool {
    dir.delete(path)
}
