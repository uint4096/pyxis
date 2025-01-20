use super::{Migrations, MigrationsTrait};
use machineid_rs::{Encryption, HWIDComponent, IdBuilder};
use rusqlite::{
    types::{FromSql, ToSqlOutput},
    ToSql, Transaction,
};
use serde_json;
use std::fmt::Debug;
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct ConfigurationMigration {
    pub name: String,
}

impl ToSql for ConfigurationMigration {
    fn to_sql(&self) -> rusqlite::Result<rusqlite::types::ToSqlOutput<'_>> {
        Ok(ToSqlOutput::Owned(rusqlite::types::Value::Text(
            self.name.clone(),
        )))
    }
}

impl FromSql for ConfigurationMigration {
    fn column_result(
        value: rusqlite::types::ValueRef<'_>,
    ) -> Result<Self, rusqlite::types::FromSqlError> {
        value.as_str().map(|s| ConfigurationMigration {
            name: s.to_string(),
        })
    }
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

impl Migrations for ConfigurationMigration {
    fn run(&self, transaction: &Transaction) -> Result<usize, rusqlite::Error> {
        let machine_id = get_machine_id();
        let json_payload = serde_json::json!({
            "device_id": machine_id.to_string()
        });

        let create_sql = "CREATE TABLE IF NOT EXISTS configuration (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL UNIQUE,
            config  TEXT
        )";

        let insert_sql = "INSERT INTO configuration (config) VALUES (?1)";

        transaction.execute(&create_sql, ())?;
        transaction.execute(&insert_sql, (&json_payload.to_string(),))
    }

    fn get_name(&self) -> String {
        self.name.clone()
    }

    fn clone_box(&self) -> Box<dyn MigrationsTrait> {
        let name = self.get_name();
        Box::new(Self { name })
    }
}

impl MigrationsTrait for ConfigurationMigration {}
