use super::{Migrations, MigrationsTrait};
use rusqlite::{
    types::{FromSql, ToSqlOutput},
    ToSql, Transaction,
};
use std::fmt::Debug;

#[derive(Debug, Clone)]
pub struct FilesMigration {
    pub name: String,
}

impl ToSql for FilesMigration {
    fn to_sql(&self) -> rusqlite::Result<rusqlite::types::ToSqlOutput<'_>> {
        Ok(ToSqlOutput::Owned(rusqlite::types::Value::Text(
            self.name.clone(),
        )))
    }
}

impl FromSql for FilesMigration {
    fn column_result(
        value: rusqlite::types::ValueRef<'_>,
    ) -> Result<Self, rusqlite::types::FromSqlError> {
        value.as_str().map(|s| FilesMigration {
            name: s.to_string(),
        })
    }
}

impl Migrations for FilesMigration {
    fn run(&self, transaction: &Transaction) -> Result<usize, rusqlite::Error> {
        let sql = "CREATE TABLE IF NOT EXISTS files (
            id   INTEGER PRIMARY KEY AUTOINCREMENT,
            uid  TEXT NOT NULL,
            dir_id INTEGER,
            title TEXT NOT NULL,
            path TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            workspace_id INTEGER NOT NULL,
            tags TEXT,
            links TEXT,
            synced INTEGER DEFAULT 0,

            FOREIGN KEY (dir_id) REFERENCES directories(id)
            ON DELETE CASCADE
        )";

        transaction.execute(sql, ())
    }

    fn get_name(&self) -> String {
        self.name.clone()
    }

    fn clone_box(&self) -> Box<dyn MigrationsTrait> {
        let name = self.get_name();
        Box::new(Self { name })
    }
}

impl MigrationsTrait for FilesMigration {}
