// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod database;
mod entities;
mod hooks;
mod migrations;

use database::{ConfigDatabase, Database};
use entities::config::{add_user_data, get_config, remove_user_data};
use entities::directories::{create_dir, delete_dir, list_dirs, update_dir};
use entities::files::{create_file, delete_file, list_files, update_file};
use entities::snapshots::{get_snapshot, update_snapshot};
use entities::updates::{get_updates, insert_updates};
use entities::workspaces::{create_workspace, delete_workspace, list_workspaces, update_workspace};
use hooks::content_hook;
use migrations::{run_migrations, run_config_migrations};
use tauri::{App, Manager};

fn main() {
    let mut database = Database::create_connection("pyxis");
    let mut config_database = ConfigDatabase(Database::create_connection("pyxis_config"));

    match run_migrations(&mut database) {
        Ok(_) => println!("Migration successful!"),
        Err(e) => eprintln!("Migration failed! Error: {}", e),
    }

    match run_config_migrations(&mut config_database.0) {
        Ok(_) => println!("Migration successful (config)!"),
        Err(e) => eprintln!("Migration failed (config)! Error: {}", e),
    }

    database.set_update_hook(content_hook, &config_database);

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(database)
        .manage(config_database)
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
            update_file,
            update_snapshot,
            get_snapshot,
            get_config,
            add_user_data,
            remove_user_data,
            get_updates,
            insert_updates
        ])
        .setup(|app: &mut App| {
            let window = app
                .get_webview_window("main")
                .expect("Failed to get main window!");
            // Doing this in tauri config does not allow super + arrow keys to work
            let _ = window.maximize();
            // window.open_devtools();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error while running tauri application");
}
