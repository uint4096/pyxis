use std::str::FromStr;

use crate::database::Database;
use machineid_rs::{Encryption, HWIDComponent, IdBuilder};
use rusqlite::{Connection, Error};
use serde::{Deserialize, Serialize};
use serde_with::serde_as;
use tauri::State;
use uuid::Uuid;

#[serde_as]
#[derive(Serialize, Deserialize, Debug)]
pub struct Configuration {
    device_id: Option<Uuid>,
    user_token: Option<String>,
    user_id: Option<Uuid>,
    username: Option<String>,
}

fn get_machine_id() -> Uuid {
    let key = "machineid_key";
    let mut builder = IdBuilder::new(Encryption::SHA1);
    builder
        .add_component(HWIDComponent::Username)
        .add_component(HWIDComponent::OSName)
        .add_component(HWIDComponent::SystemID);
    let system_id = builder.build(key).expect("Failed to build machine id!");

    Uuid::new_v5(&Uuid::NAMESPACE_DNS, system_id.as_bytes())
}

impl Configuration {
    fn new(user_token: Option<String>, user_id: Option<String>, username: Option<String>) -> Self {
        Self {
            device_id: Some(get_machine_id()),
            user_token,
            user_id: if let Some(uid) = user_id {
                Some(
                    Uuid::from_str(&uid).expect("[Configuration] Failed to convert string to uuid"),
                )
            } else {
                None
            },
            username,
        }
    }

    fn get(conn: &Connection) -> Result<Configuration, Error> {
        let mut stmt = conn.prepare("SELECT config FROM configuration")?;
        let config: Configuration = stmt.query_row([], |row| {
            let json_str: String = row.get(0)?;
            let config: Configuration = serde_json::from_str(&json_str)
                .expect("[Configuration] Failed to cast JSON to struct!");

            Ok(config)
        })?;

        Ok(config)
    }

    fn add(&self, conn: &Connection) -> Result<(), Error> {
        let json_payload = serde_json::json!({
            "device_id": self.device_id,
            "user_token": self.user_token,
            "user_id": self.user_id,
            "username": self.username
        });

        let update_sql = "UPDATE configuration SET config = (?1)";

        conn.execute(&update_sql, (&json_payload.to_string(),))?;

        Ok(())
    }
}

#[tauri::command]
pub fn add_user_data(
    username: String,
    user_token: String,
    user_id: String,
    database: State<Database>,
) -> Option<bool> {
    let content = Configuration::new(Some(user_token), Some(user_id), Some(username));

    match content.add(&database.get_connection()) {
        Ok(_) => Some(true),
        Err(e) => {
            eprintln!("[Configuration] Failed to add user data to config! {}", e);
            Some(false)
        }
    }
}

#[tauri::command]
pub fn remove_user_data(database: State<Database>) -> Option<bool> {
    let content = Configuration::new(None, None, None);

    match content.add(&database.get_connection()) {
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
pub fn get_config(database: State<Database>) -> Option<Configuration> {
    match Configuration::get(&database.get_connection()) {
        Ok(content) => Some(content),
        Err(e) => {
            eprintln!("[Configuration] Failed to fetch! {}", e);
            None
        }
    }
}
