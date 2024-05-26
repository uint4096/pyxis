// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod config;
mod dir_reader;
mod document;
mod ffi;
mod reader;
mod writer;

use crate::ffi::{
    create_dir, create_file, delete_dir, delete_file, read_store_config, read_system_config,
    read_workspace_config, read_workspace_tree, rename_dir, rename_file, write_store_config,
    write_system_config, write_workspace_config,
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
            create_file,
            rename_file,
            delete_file,
            create_dir,
            rename_dir,
            delete_dir
        ])
        .setup(|app: &mut App| {
            let window = app.get_window("main").expect("Failed to get main window!");
            // Doing this in tauri config does not allow super + arrow keys to work
            let _ = window.maximize();
            window.open_devtools();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
