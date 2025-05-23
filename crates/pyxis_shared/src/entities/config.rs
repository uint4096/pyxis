use rusqlite::{Connection, Error};
use serde::{Deserialize, Serialize};
use serde_with::serde_as;
use std::collections::HashMap;
use uuid::Uuid;

use crate::utils::get_machine_id::get_machine_id;

pub type Features = HashMap<String, (bool, String)>;

#[serde_as]
#[derive(Serialize, Deserialize, Debug)]
pub struct Configuration {
    pub device_id: Option<Uuid>,
    pub user_token: Option<String>,
    pub user_id: String,
    pub username: Option<String>,
    pub features: Option<Features>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ConfigEntry {
    pub id: Option<i64>,
    pub user_id: String,
    pub config: Configuration,
}

impl ConfigEntry {
    pub fn new(
        user_token: Option<String>,
        user_id: String,
        username: Option<String>,
        features: Option<Features>,
    ) -> Self {
        Self {
            id: None,
            user_id: user_id.to_owned(),
            config: Configuration {
                device_id: Some(get_machine_id()),
                user_token,
                user_id,
                username,
                features,
            },
        }
    }

    pub fn get_logged_in_user(conn: &Connection) -> Result<Configuration, Error> {
        let mut stmt = conn.prepare("SELECT config FROM configuration WHERE json_extract(config, '$.user_token') IS NOT NULL")?;
        let config = stmt.query_row([], |row| {
            let json_str: String = row.get(0)?;
            let config: Configuration = serde_json::from_str(&json_str)
                .expect("[Configuration] Failed to cast JSON to struct!");

            Ok(config)
        });

        config
    }

    pub fn get(conn: &Connection, user_id: String) -> Result<Configuration, Error> {
        let mut stmt = conn.prepare("SELECT config FROM configuration WHERE user_id=?1")?;
        let config = stmt.query_row([&user_id], |row| {
            let json_str: String = row.get(0)?;
            let config: Configuration = serde_json::from_str(&json_str)
                .expect("[Configuration] Failed to cast JSON to struct!");

            Ok(config)
        });

        config
    }

    pub fn add(&self, conn: &Connection) -> Result<(), Error> {
        let Configuration {
            device_id,
            user_token,
            user_id,
            username,
            features,
        } = &self.config;
        let json_payload = serde_json::json!({
            "device_id": device_id,
            "user_token": user_token,
            "user_id": user_id,
            "username": username,
            "features": features
        });

        let upsert_sql = "INSERT INTO configuration (user_id, config) VALUES (?1, ?2) ON CONFLICT(user_id) DO UPDATE SET config=?2";

        conn.execute(&upsert_sql, (&self.user_id, &json_payload.to_string()))?;

        Ok(())
    }
}
