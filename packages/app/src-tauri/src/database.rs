use std::{
    path::PathBuf,
    sync::{Mutex, MutexGuard},
};

use rusqlite::Connection;

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    fn get_db_path() -> PathBuf {
        let mut path = dirs::data_local_dir().expect("Failed to find local data directory");
        path.push("pyxis");

        std::fs::create_dir_all(&path).expect("Failed to create app directory");
        path.push("pyxis.db");
        path
    }

    pub fn create_connection() -> Self {
        let database = match Connection::open(Database::get_db_path()) {
            Ok(conn) => {
                conn.execute("PRAGMA foreign_keys = ON; PRAGMA journal_mode=WAL;", [])
                    .unwrap_or_default();

                Database {
                    conn: Mutex::new(conn),
                }
            }
            Err(e) => {
                panic!("Connection failed. Error: {}", e)
            }
        };

        database
    }

    pub fn get_connection(&self) -> MutexGuard<Connection> {
        match self.conn.lock() {
            Ok(conn) => conn,
            Err(e) => {
                eprintln!("Failed to acquire lock on DB connection. {}", e);
                println!("Attempting to recover,,,");
                e.into_inner()
            }
        }
    }
}
