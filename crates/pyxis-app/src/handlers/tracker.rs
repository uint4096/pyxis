use std::str::FromStr;

use pyxis_shared::{
    database::ConfigDatabase,
    entities::{queue::Source, tracker::Tracker},
};
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn last_synced_record_id(
    sync_db: State<ConfigDatabase>,
    sources: Vec<String>,
    device_id: String,
    user_id: String,
) -> Option<i64> {
    let sources: Vec<Source> = sources
        .into_iter()
        .map(|source| Source::from_str(&source).unwrap())
        .collect();

    match Tracker::get(
        &sync_db.0.get_connection(),
        sources,
        Uuid::from_str(&device_id).unwrap(),
        Uuid::from_str(&user_id).unwrap(),
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
    sync_db: State<ConfigDatabase>,
    source: String,
    device_id: String,
    record_id: i64,
    user_id: String,
) -> Option<bool> {
    let record = Tracker::new(
        None,
        Uuid::from_str(&device_id).unwrap(),
        Source::from_str(&source).unwrap(),
        record_id,
        Uuid::from_str(&user_id).unwrap(),
        None,
    );

    match record.add(&sync_db.0.get_connection()) {
        Ok(_) => Some(true),
        Err(e) => {
            eprintln!("[Tracker] Failed to add! {}", e);
            Some(false)
        }
    }
}
