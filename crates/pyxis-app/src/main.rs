// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod handlers;
mod hooks;
mod migrations;

use handlers::config::{add_user_data, get_config, remove_user_data};
use handlers::directories::{create_dir, delete_dir, list_dirs, update_dir};
use handlers::files::{create_file, delete_file, list_files, update_file};
use handlers::snapshots::{get_snapshot, update_snapshot};
use handlers::updates::{get_updates, insert_updates};
use handlers::workspaces::{create_workspace, delete_workspace, list_workspaces, update_workspace};
use hooks::content_hook;
use migrations::{run_config_migrations, run_migrations};
use pyxis_db::database::{ConfigDatabase, Database};
use tauri::{App, Manager};

fn main() {
    let mut database = Database::create_connection("pyxis");

    /*
     * SQLite locks the database file during inserts and updates. Hence, a different
     * database to handle queue operations
     */
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
