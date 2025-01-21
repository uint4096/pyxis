use pyxis_shared::{database::ConfigDatabase, entities::devices::Device};
use tauri::State;

#[tauri::command]
pub fn add_devices(
    device_ids: Vec<String>,
    config_database: State<ConfigDatabase>,
) -> Option<bool> {
    let devices = Device::new(None, device_ids);

    match devices.add(&config_database.0.get_connection()) {
        Ok(_) => Some(true),
        Err(e) => {
            eprintln!("[Device] Failed to add device! {}", e);
            Some(false)
        }
    }
}

#[tauri::command]
pub fn list_devices(config_database: State<ConfigDatabase>) -> Option<Vec<String>> {
    match Device::list(&config_database.0.get_connection()) {
        Ok(ids) => Some(ids),
        Err(e) => {
            eprintln!("[Device] Failed to fetch! {}", e);
            None
        }
    }
}
