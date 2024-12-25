use super::{Migrations, MigrationsTrait};
use rusqlite::{
    types::{FromSql, ToSqlOutput},
    ToSql, Transaction,
};
use std::fmt::Debug;

#[derive(Debug, Clone)]
pub struct SnapshotsMigration {
    pub name: String,
}

impl ToSql for SnapshotsMigration {
    fn to_sql(&self) -> rusqlite::Result<rusqlite::types::ToSqlOutput<'_>> {
        Ok(ToSqlOutput::Owned(rusqlite::types::Value::Text(
            self.name.clone(),
        )))
    }
}

impl FromSql for SnapshotsMigration {
    fn column_result(
        value: rusqlite::types::ValueRef<'_>,
    ) -> Result<Self, rusqlite::types::FromSqlError> {
        value.as_str().map(|s| SnapshotsMigration {
            name: s.to_string(),
        })
    }
}

impl Migrations for SnapshotsMigration {
    fn run(&self, transaction: &Transaction) -> Result<usize, rusqlite::Error> {
        let sql = "CREATE TABLE IF NOT EXISTS snapshots (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            file_id     INTEGER NOT NULL UNIQUE,
            content     BLOB,
            updated_at  TEXT NOT NULL,
            snapshot_id INTEGER NOT NULL,

            FOREIGN KEY (file_id) REFERENCES files(id)
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

impl MigrationsTrait for SnapshotsMigration {}
