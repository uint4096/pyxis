use std::path::PathBuf;

use rusqlite::Connection;

pub struct Database {
    pub conn: Connection,
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
        let connection = match Connection::open(Database::get_db_path()) {
            Ok(conn) => Database { conn },
            Err(e) => {
                panic!("Connection failed. Error: {}", e)
            }
        };

        connection
    }
}
