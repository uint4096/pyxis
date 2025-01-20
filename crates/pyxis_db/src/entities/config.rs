use machineid_rs::{Encryption, HWIDComponent, IdBuilder};
use rusqlite::{Connection, Error};
use serde::{Deserialize, Serialize};
use serde_with::serde_as;
use std::collections::HashMap;
use uuid::Uuid;

#[serde_as]
#[derive(Serialize, Deserialize, Debug)]
pub struct Configuration {
    pub device_id: Option<Uuid>,
    pub user_token: Option<String>,
    pub user_id: String,
    pub username: Option<String>,
    pub features: Option<HashMap<String, String>>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ConfigEntry {
    pub id: Option<i64>,
    pub user_id: String,
    pub config: Configuration,
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

impl ConfigEntry {
    pub fn new(
        user_token: Option<String>,
        user_id: String,
        username: Option<String>,
        features: Option<HashMap<String, String>>,
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

        let upsert_sql = "INSERT INTO configuration SET user_id=?1, config=?2 ON CONFLICT(user_id) DO UPDATE SET config=?2";

        conn.execute(&upsert_sql, (&self.user_id, &json_payload.to_string()))?;

        Ok(())
    }
}
