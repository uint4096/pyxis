use crate::config::system::SystemConfig;

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
pub fn write_workspace_config(path: String, config: WorkspaceConfig) -> bool {
    let workspace = Workspace(&path);
    workspace.save_config(config)
}

#[tauri::command]
pub fn read_system_config() -> FileContent {
    if let Some(home_dir) = dirs::home_dir() {
        let system = System(
            &home_dir
                .to_str()
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
        let dir = home_dir.join("pyxis");
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
