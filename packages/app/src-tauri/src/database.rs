use std::{
    path::PathBuf,
    sync::{mpsc::channel, Arc, Mutex, MutexGuard}, thread,
};

use rusqlite::{hooks::Action, Connection};

pub struct Database {
    conn: Arc<Mutex<Connection>>,
}

struct HookPayload {
    action: Action,
    db_name: String,
    table_name: String,
    row_id: i64,
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
                    conn: Arc::new(Mutex::new(conn)),
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
                println!("Attempting to recover...");
                e.into_inner()
            }
        }
    }

    pub fn set_update_hook<F>(&self, hook: F)
    where
        F: Fn(Action, &str, &str, i64, &Connection) + Send + Sync + 'static,
    {
        let (sender, receiver) = channel::<HookPayload>();
        let conn = self.conn.clone();

        thread::spawn(move || {
            while let Ok(update) = receiver.recv() {
                if let Ok(conn) = conn.lock() {
                    hook(
                        update.action,
                        &update.db_name,
                        &update.table_name,
                        update.row_id,
                        &conn,
                    );
                }
            }
        });

        let update_hook = move |action, db: &str, table: &str, row_id: i64| {
            let _ = sender.send(HookPayload {
                action,
                db_name: db.to_string(),
                table_name: table.to_string(),
                row_id,
            });
        };

        self.get_connection().update_hook(Some(update_hook));
    }
}
