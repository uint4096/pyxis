// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod database;
mod entities;
mod migrations;

use database::Database;
use entities::directories::{create_dir, delete_dir, list_dirs, update_dir};
use entities::files::{create_file, delete_file, list_files, update_file};
use entities::workspaces::{create_workspace, delete_workspace, list_workspaces, update_workspace};
use migrations::run_migrations;
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
            create_workspace,
            list_workspaces,
            delete_workspace,
            update_workspace,
            create_dir,
            list_dirs,
            delete_dir,
            update_dir,
            create_file,
            delete_file,
            list_files,
            update_file
        ])
        .setup(|app: &mut App| {
            let window = app.get_window("main").expect("Failed to get main window!");
            // Doing this in tauri config does not allow super + arrow keys to work
            let _ = window.maximize();
            window.open_devtools();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error while running tauri application");
}
