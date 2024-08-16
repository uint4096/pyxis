use super::{Migrations, MigrationsTrait};
use rusqlite::{
    types::{FromSql, ToSqlOutput},
    ToSql, Transaction,
};
use std::fmt::Debug;

pub struct WorkspaceMigration {
    pub name: String,
}

impl ToSql for WorkspaceMigration {
    fn to_sql(&self) -> rusqlite::Result<rusqlite::types::ToSqlOutput<'_>> {
        Ok(ToSqlOutput::Owned(rusqlite::types::Value::Text(
            self.name.clone(),
        )))
    }
}

impl FromSql for WorkspaceMigration {
    fn column_result(
        value: rusqlite::types::ValueRef<'_>,
    ) -> Result<Self, rusqlite::types::FromSqlError> {
        value.as_str().map(|s| WorkspaceMigration {
            name: s.to_string(),
        })
    }
}

impl Debug for WorkspaceMigration {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("WorkspaceMigration")
            .field("name", &self.name)
            .finish()
    }
}

impl Clone for WorkspaceMigration {
    fn clone(&self) -> Self {
        Self {
            name: self.name.clone(),
        }
    }
}

impl Migrations for WorkspaceMigration {
    fn run(&self, transaction: &Transaction) -> Result<usize, rusqlite::Error> {
        let sql = "CREATE TABLE IF NOT EXISTS workspaces (
            id   INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            is_selected INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )";

        transaction.execute(sql, ())
    }

    // fn revert(&self, transaction: &Transaction) -> Result<usize, rusqlite::Error> {
    //     let sql = "DROP TABLE workspaces";

    //     transaction.execute(sql, ())
    // }

    fn get_name(&self) -> String {
        self.name.clone()
    }

    fn clone_box(&self) -> Box<dyn MigrationsTrait> {
        let name = self.get_name();
        Box::new(Self { name })
    }
}

impl MigrationsTrait for WorkspaceMigration {}
