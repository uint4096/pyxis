use std::collections::HashMap;

use pyxis_shared::{
    database::ConfigDatabase,
    entities::config::{ConfigEntry, Configuration},
};
use tauri::State;

#[tauri::command]
pub fn add_user_data(
    username: String,
    user_token: String,
    user_id: String,
    features: Option<HashMap<String, String>>,
    config_database: State<ConfigDatabase>,
) -> Option<bool> {
    let content = ConfigEntry::new(Some(user_token), user_id, Some(username), features);

    match content.add(&config_database.0.get_connection()) {
        Ok(_) => Some(true),
        Err(e) => {
            eprintln!("[Configuration] Failed to add user data to config! {}", e);
            Some(false)
        }
    }
}

#[tauri::command]
pub fn remove_user_data(user_id: String, config_database: State<ConfigDatabase>) -> Option<bool> {
    let content = ConfigEntry::new(None, user_id, None, None);

    match content.add(&config_database.0.get_connection()) {
        Ok(_) => Some(true),
        Err(e) => {
            eprintln!(
                "[Configuration] Failed to remove user data from config! {}",
                e
            );
            Some(false)
        }
    }
}

#[tauri::command]
pub fn get_config(
    user_id: String,
    config_database: State<ConfigDatabase>,
) -> Option<Configuration> {
    match ConfigEntry::get(&config_database.0.get_connection(), user_id) {
        Ok(content) => Some(content),
        Err(e) => {
            eprintln!("[Configuration] Failed to fetch! {}", e);
            None
        }
    }
}
