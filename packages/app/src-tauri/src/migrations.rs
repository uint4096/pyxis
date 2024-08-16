mod workspaces;

use std::{fmt::Debug, rc::Rc};

use rusqlite::{types::ToSqlOutput, Error, Row, ToSql, Transaction};
use workspaces::WorkspaceMigration;

use crate::database::Database;

pub trait MigrationsTrait: Migrations + ToSql + Debug {}

enum MigrationStatus {
    Success,
    Failed,
    InProgress,
}

impl ToSql for MigrationStatus {
    fn to_sql(&self) -> rusqlite::Result<rusqlite::types::ToSqlOutput<'_>> {
        match self {
            MigrationStatus::Failed => Ok(ToSqlOutput::Owned(rusqlite::types::Value::Text(
                String::from("failed"),
            ))),
            MigrationStatus::InProgress => Ok(ToSqlOutput::Owned(rusqlite::types::Value::Text(
                String::from("in_progress"),
            ))),
            MigrationStatus::Success => Ok(ToSqlOutput::Owned(rusqlite::types::Value::Text(
                String::from("success"),
            ))),
        }
    }
}

pub trait Migrations {
    fn get_name(&self) -> String;
    fn run(&self, transaction: &Transaction) -> Result<usize, Error>;
    fn clone_box(&self) -> Box<dyn MigrationsTrait>;
}

struct Migration {
    entites: Rc<Vec<Box<dyn MigrationsTrait>>>,
}

impl Migration {
    fn from_row(row: &Row) -> Result<String, rusqlite::Error> {
        let name: String = row.get(0)?;
        Ok(name)
    }

    fn init(&self, database: &Database) -> Result<usize, Error> {
        let sql = "CREATE TABLE IF NOT EXISTS migrations (
            id   INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            status TEXT NOT NULL
        )";

        database.conn.execute(sql, ())
    }

    fn list_migrations_to_run(&self, database: &Database) -> Self {
        let names = self.entites.iter().map(|e| e.get_name());
        let str_names = names
            .map(|name| format!("'{}'", name))
            .collect::<Vec<String>>()
            .join(",");

        println!("Migrations Query: {}", str_names);

        let query = format!("SELECT name FROM migrations WHERE name IN ({})", str_names);

        let mut sql = database
            .conn
            .prepare(&query)
            .expect("Failed to prepare statement!");

        let migrations_iter = sql
            .query_map([], |row| Migration::from_row(row))
            .expect("Failed to execute query!");

        let migrations: Vec<String> = migrations_iter.collect::<Result<Vec<_>, _>>().unwrap();

        let filtered_entities = {
            let mut entities: Vec<Box<dyn MigrationsTrait>> = vec![];

            for entity in self.entites.iter() {
                if !migrations.contains(&entity.get_name()) {
                    entities.push(entity.clone_box())
                }
            }

            entities
        };

        Self {
            entites: Rc::new(filtered_entities),
        }
    }

    fn run(&self, entity: &Box<dyn MigrationsTrait>, database: &mut Database) -> Result<(), Error> {
        database.conn.execute(
            "INSERT INTO migrations (name, status) VALUES (?1, ?2)",
            (entity, MigrationStatus::InProgress),
        )?;

        let transaction = database.conn.transaction()?;
        match entity.run(&transaction) {
            Ok(_) => {
                println!(
                    "Migration ran for entity: {:?}. Attempting to commit!",
                    entity
                );
                transaction.commit().expect("Commit failed!");
                database.conn.execute(
                    "UPDATE migrations SET status = (?1) WHERE name = (?2)",
                    (MigrationStatus::Success, entity),
                )?;

                Ok(())
            }
            Err(_) => {
                println!("Migration failed for entity: {:?}", entity);
                transaction.rollback()?;
                database.conn.execute(
                    "UPDATE migrations SET status = (?1) WHERE name = (?2)",
                    (MigrationStatus::Failed, entity),
                )?;

                Ok(())
            }
        }
    }
}

pub fn run_migrations(database: &mut Database) -> Result<(), Error> {
    //List new migrations here
    let migration = Migration {
        entites: Rc::new(vec![Box::new(WorkspaceMigration {
            name: String::from("workspace_migration"),
        })]),
    };

    migration.init(database)?;
    println!("Migration init successful");

    let migrations_to_run = migration.list_migrations_to_run(database);
    println!("Migrations to run: {:?}", migrations_to_run.entites);

    for entity in migrations_to_run.entites.iter() {
        migration.run(entity, database)?;
    }

    Ok(())
}
