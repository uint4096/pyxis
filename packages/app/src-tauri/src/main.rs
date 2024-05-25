// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod config;
mod dir_reader;
mod ffi;
mod reader;
mod writer;
mod document;

use crate::ffi::{
    read_store_config, read_system_config, read_workspace_tree, read_workspace_config,
    write_store_config, write_system_config, write_workspace_config, create_file
};
use tauri::{App, Manager};

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            read_store_config,
            write_store_config,
            read_workspace_config,
            write_workspace_config,
            read_workspace_tree,
            read_system_config,
            write_system_config,
            create_file
        ])
        .setup(|app: &mut App| {
            let window = app.get_window("main").expect("Failed to get main window!");
            // Doing this in tauri config does not allow super + arrow keys to work
            let _ = window.maximize();
            // window.open_devtools();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
