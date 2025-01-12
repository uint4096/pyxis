use std::str::FromStr;

use pyxis_db::{
    database::ConfigDatabase,
    entities::{queue::Source, tracker::Tracker},
};
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn last_synced_record_id(
    config_database: State<ConfigDatabase>,
    sources: Vec<String>,
    device_id: String,
) -> Option<i64> {
    let sources: Vec<Source> = sources
        .into_iter()
        .map(|source| Source::from_str(&source).unwrap())
        .collect();

    match Tracker::get(
        &config_database.0.get_connection(),
        sources,
        Uuid::from_str(&device_id).unwrap(),
    ) {
        Ok(record) => Some(record.record_id),
        Err(e) => {
            eprintln!("[Tracker] Failed to fetch! {}", e);
            Some(0)
        }
    }
}

#[tauri::command]
pub fn add_record(
    config_database: State<ConfigDatabase>,
    source: String,
    device_id: String,
    record_id: i64,
) -> Option<bool> {
    let record = Tracker::new(
        None,
        Uuid::from_str(&device_id).unwrap(),
        Source::from_str(&source).unwrap(),
        record_id,
    );

    match record.add(&config_database.0.get_connection()) {
        Ok(_) => Some(true),
        Err(e) => {
            eprintln!("[Tracker] Failed to fetch! {}", e);
            Some(false)
        }
    }
}
