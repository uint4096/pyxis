mod config;
mod directories;
mod files;
mod listener_queue;
mod snapshots;
mod tracker;
mod updates;
mod workspaces;

use std::{collections::HashMap, fmt::Debug, rc::Rc};

use config::ConfigurationMigration;
use directories::DirectoriesMigration;
use files::FilesMigration;
use listener_queue::ListenerQueueMigration;
use rusqlite::{types::ToSqlOutput, Error, Row, ToSql, Transaction};
use snapshots::SnapshotsMigration;
use tracker::TrackerMigration;
use updates::UpdatesMigration;
use workspaces::WorkspaceMigration;

use pyxis_db::database::Database;

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
    fn from_row(row: &Row) -> Result<(String, String), rusqlite::Error> {
        let name: String = row.get(0)?;
        let status: String = row.get(1)?;
        Ok((name, status))
    }

    fn dup_check(&self) -> bool {
        let map: HashMap<String, bool> = HashMap::new();

        for entity in self.entites.iter() {
            if map.contains_key(&entity.get_name()) {
                return false;
            }
        }

        true
    }

    fn init(&self, database: &Database) -> Result<usize, Error> {
        let sql = "CREATE TABLE IF NOT EXISTS migrations (
            id   INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            status TEXT NOT NULL
        )";

        if !self.dup_check() {
            panic!("Migration names must be unique!");
        }

        database.get_connection().execute(sql, ())
    }

    fn list_migrations_to_run(&self, database: &Database) -> Self {
        let names = self.entites.iter().map(|e| e.get_name());
        let str_names = names
            .map(|name| format!("'{}'", name))
            .collect::<Vec<String>>()
            .join(",");

        let conn = database.get_connection();

        let query = format!(
            "SELECT name, status FROM migrations WHERE name IN ({})",
            str_names
        );
        let mut sql = conn.prepare(&query).expect("Failed to prepare statement!");

        let migrations_iter = sql
            .query_map([], |row| Migration::from_row(row))
            .expect("Failed to execute query!");

        let migrations: Vec<(String, String)> =
            migrations_iter.collect::<Result<Vec<_>, _>>().unwrap();

        let filtered_entities = {
            let mut entities: Vec<Box<dyn MigrationsTrait>> = vec![];

            for entity in self.entites.iter() {
                if (migrations
                    .iter()
                    .find(|m| m.0 == entity.get_name() && m.1 == String::from("success")))
                .is_none()
                {
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
        database.get_connection().execute(
            "INSERT INTO migrations (name, status) VALUES (?1, ?2) ON CONFLICT(name) DO UPDATE SET status=?2",
            (entity, MigrationStatus::InProgress),
        )?;

        let mut conn = database.get_connection();
        let transaction = conn.transaction()?;
        match entity.run(&transaction) {
            Ok(_) => {
                println!(
                    "Migration ran for entity: {:?}. Attempting to commit!",
                    entity
                );
                match transaction.commit() {
                    Ok(_) => {
                        println!("Transaction committed!")
                    }
                    Err(e) => {
                        panic!("Failed to commit! {e}. Aborting...");
                    }
                }

                conn.execute(
                    "UPDATE migrations SET status = (?1) WHERE name = (?2)",
                    (MigrationStatus::Success, entity),
                )?;

                Ok(())
            }
            Err(e) => {
                eprintln!("Migration failed for entity: {:?}. Error: {e}", entity);
                transaction.rollback()?;
                conn.execute(
                    "UPDATE migrations SET status = (?1) WHERE name = (?2)",
                    (MigrationStatus::Failed, entity),
                )?;

                Err(e)
            }
        }
    }
}

pub fn run_migrations(database: &mut Database) -> Result<(), Error> {
    let migration = Migration {
        entites: Rc::new(vec![
            Box::new(WorkspaceMigration {
                name: String::from("workspace_migration"),
            }),
            Box::new(DirectoriesMigration {
                name: String::from("directories_migration"),
            }),
            Box::new(FilesMigration {
                name: String::from("files_migration"),
            }),
            Box::new(SnapshotsMigration {
                name: String::from("snapshots_migration"),
            }),
            Box::new(UpdatesMigration {
                name: String::from("updates_migration"),
            }),
        ]),
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

pub fn run_config_migrations(database: &mut Database) -> Result<(), Error> {
    let migration = Migration {
        entites: Rc::new(vec![
            Box::new(ListenerQueueMigration {
                name: String::from("listener_queue_migration"),
            }),
            Box::new(ConfigurationMigration {
                name: String::from("configuration_migration"),
            }),
            Box::new(TrackerMigration {
                name: String::from("tracker_migration"),
            }),
        ]),
    };

    migration.init(database)?;
    println!("Migration init successful (config)");

    let migrations_to_run = migration.list_migrations_to_run(database);
    println!(
        "Migrations to run (config): {:?}",
        migrations_to_run.entites
    );

    for entity in migrations_to_run.entites.iter() {
        migration.run(entity, database)?;
    }

    Ok(())
}
