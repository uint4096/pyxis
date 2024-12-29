use pyxis_db::{database::ConfigDatabase, entities::config::Configuration};
use tauri::State;

#[tauri::command]
pub fn add_user_data(
    username: String,
    user_token: String,
    user_id: String,
    config_database: State<ConfigDatabase>,
) -> Option<bool> {
    let content = Configuration::new(Some(user_token), Some(user_id), Some(username));

    match content.add(&config_database.0.get_connection()) {
        Ok(_) => Some(true),
        Err(e) => {
            eprintln!("[Configuration] Failed to add user data to config! {}", e);
            Some(false)
        }
    }
}

#[tauri::command]
pub fn remove_user_data(config_database: State<ConfigDatabase>) -> Option<bool> {
    let content = Configuration::new(None, None, None);

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
pub fn get_config(config_database: State<ConfigDatabase>) -> Option<Configuration> {
    match Configuration::get(&config_database.0.get_connection()) {
        Ok(content) => Some(content),
        Err(e) => {
            eprintln!("[Configuration] Failed to fetch! {}", e);
            None
        }
    }
}
