use super::{Migrations, MigrationsTrait};
use rusqlite::{
    types::{FromSql, ToSqlOutput},
    ToSql, Transaction,
};
use std::fmt::Debug;

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

impl Migrations for ConfigurationMigration {
    fn run(&self, transaction: &Transaction) -> Result<usize, rusqlite::Error> {
        let create_sql = "CREATE TABLE IF NOT EXISTS configuration (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL UNIQUE,
            config  TEXT
        )";

        transaction.execute(&create_sql, ())
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
