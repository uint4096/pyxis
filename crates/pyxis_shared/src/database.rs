use std::{
    path::PathBuf,
    sync::{mpsc::channel, Arc, Mutex, MutexGuard},
    thread,
};

use rusqlite::{hooks::Action, Connection};

pub struct Database {
    pub conn: Arc<Mutex<Connection>>,
}

struct HookPayload {
    action: Action,
    db_name: String,
    table_name: String,
    row_id: i64,
}

pub struct ConfigDatabase(pub Database);

impl Database {
    fn get_db_path(db_name: &str) -> PathBuf {
        let mut path = dirs::data_local_dir().expect("Failed to find local data directory");
        path.push("pyxis");

        std::fs::create_dir_all(&path).expect("Failed to create app directory");
        path.push(format!("{}.db", db_name));
        path
    }

    pub fn create_connection(db_name: &str) -> Self {
        let database = match Connection::open(Database::get_db_path(db_name)) {
            Ok(conn) => {
                conn.execute("PRAGMA journal_mode=WAL;", [])
                    .unwrap_or_default();

                conn.execute("PRAGMA foreign_keys=ON;", [])
                    .unwrap_or_default();

                conn.execute("PRAGMA busy_timeout=5000;", [])
                    .unwrap_or_default();

                conn.execute("PRAGMA synchronous=NORMAL;", [])
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

    pub fn set_update_hook<F>(&self, hook: F, config_db: &ConfigDatabase)
    where
        F: Fn(Action, &str, &str, i64, &Connection, &Connection) + Send + Sync + 'static,
    {
        let (sender, receiver) = channel::<HookPayload>();
        let conn = self.conn.clone();
        let config_conn = config_db.0.conn.clone();

        thread::spawn(move || {
            while let Ok(update) = receiver.recv() {
                if let Ok(conn) = conn.lock() {
                    if let Ok(config_conn) = config_conn.lock() {
                        hook(
                            update.action,
                            &update.db_name,
                            &update.table_name,
                            update.row_id,
                            &conn,
                            &config_conn,
                        );
                    }
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
