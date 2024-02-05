// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{App, Manager};

fn main() {
  tauri::Builder::default()
    .setup(|app: &mut App| {
    expect("error while running tauri application");
}
