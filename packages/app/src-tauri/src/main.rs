// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod config;
mod database;
mod dir_reader;
mod document;
mod entities;
mod ffi;
mod migrations;
mod reader;
mod writer;

use database::Database;
use entities::directories::{create_dir, delete_dir, list_dirs, update_dir};
use entities::workspaces::{create_workspace, delete_workspace, list_workspaces, update_workspace};
use migrations::run_migrations;

use crate::ffi::{
    create_directory, create_file, delete_directory, delete_file, read_file, read_store_config,
    read_system_config, read_workspace_config, read_workspace_tree, rename_dir, rename_file,
    write_file, write_store_config, write_system_config, write_workspace_config,
};
use tauri::{App, Manager};

fn main() {
    let mut database = Database::create_connection();
    match run_migrations(&mut database) {
        Ok(_) => println!("Migration successful!"),
        Err(e) => eprintln!("Migration failed! Error: {}", e),
    }

    tauri::Builder::default()
        .manage(database)
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
            create_directory,
            rename_dir,
            delete_directory,
            read_file,
            write_file,
            create_workspace,
            list_workspaces,
            delete_workspace,
            update_workspace,
            create_dir,
            list_dirs,
            delete_dir,
            update_dir
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
