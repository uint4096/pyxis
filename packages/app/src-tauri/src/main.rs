// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{App, Manager};

fn main() {
  tauri::Builder::default()
    .setup(|app: &mut App| {
      let window = app.get_window("main").expect("Failed to get main window!");
      // Doing this in tauri config does not allow super + arrow keys to work
      let _ = window.maximize();
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
