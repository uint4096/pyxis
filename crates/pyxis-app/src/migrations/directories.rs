use super::{Migrations, MigrationsTrait};
use rusqlite::{
    types::{FromSql, ToSqlOutput},
    ToSql, Transaction,
};
use std::fmt::Debug;

#[derive(Debug, Clone)]
pub struct DirectoriesMigration {
    pub name: String,
}

impl ToSql for DirectoriesMigration {
    fn to_sql(&self) -> rusqlite::Result<rusqlite::types::ToSqlOutput<'_>> {
        Ok(ToSqlOutput::Owned(rusqlite::types::Value::Text(
            self.name.clone(),
        )))
    }
}

impl FromSql for DirectoriesMigration {
    fn column_result(
        value: rusqlite::types::ValueRef<'_>,
    ) -> Result<Self, rusqlite::types::FromSqlError> {
        value.as_str().map(|s| DirectoriesMigration {
            name: s.to_string(),
        })
    }
}

impl Migrations for DirectoriesMigration {
    fn run(&self, transaction: &Transaction) -> Result<usize, rusqlite::Error> {
        let sql = "CREATE TABLE IF NOT EXISTS directories (
            id   INTEGER PRIMARY KEY AUTOINCREMENT,
            uid  TEXT NOT NULL,
            name TEXT NOT NULL,
            workspace_id INTEGER NOT NULL,
            parent_uid TEXT,
            path TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            synced INTEGER DEFAULT 0,

            FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
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

impl MigrationsTrait for DirectoriesMigration {}
