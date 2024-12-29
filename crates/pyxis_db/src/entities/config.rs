use std::str::FromStr;
use machineid_rs::{Encryption, HWIDComponent, IdBuilder};
use rusqlite::{Connection, Error};
use serde::{Deserialize, Serialize};
use serde_with::serde_as;
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
    pub fn new(user_token: Option<String>, user_id: Option<String>, username: Option<String>) -> Self {
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

    pub fn get(conn: &Connection) -> Result<Configuration, Error> {
        let mut stmt = conn.prepare("SELECT config FROM configuration")?;
        let config = stmt.query_row([], |row| {
            let json_str: String = row.get(0)?;
            let config: Configuration = serde_json::from_str(&json_str)
                .expect("[Configuration] Failed to cast JSON to struct!");

            Ok(config)
        });

        config
    }

    pub fn add(&self, conn: &Connection) -> Result<(), Error> {
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