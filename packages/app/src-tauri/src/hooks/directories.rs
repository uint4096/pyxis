use rusqlite::{Connection, Error};
use serde_json::json;

use crate::entities::directories::DirectoryRaw;

use super::listener::Listener;

pub struct DirectoryListener {
    pub name: String,
}

impl DirectoryListener {
    fn get_data(connection: &Connection, row_id: i64) -> Result<DirectoryRaw, Error> {
        let mut sql = connection
                .prepare("SELECT id, uid, name, workspace_id, path, parent_uid, created_at, updated_at from directories WHERE id=?1")?;

        sql.query_row(&[&row_id], |row| -> Result<DirectoryRaw, Error> {
            Ok(DirectoryRaw {
                id: row.get(0)?,
                uid: row.get(1)?,
                name: row.get(2)?,
                workspace_id: row.get(3)?,
                path: row.get(4)?,
                parent_uid: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })
    }
}

impl Listener for DirectoryListener {
    fn insert(&self, connection: &Connection, row_id: i64) -> Result<(), Error> {
        let payload = serde_json::to_string(&DirectoryListener::get_data(connection, row_id)?)
            .expect("[Files Listener] Failed to serialize to json!");

        self.insert_into_queue(connection, payload, "insert", &self.name)
    }

    fn update(&self, connection: &Connection, row_id: i64) -> Result<(), Error> {
        let payload = serde_json::to_string(&DirectoryListener::get_data(connection, row_id)?)
            .expect("[Files Listener] Failed to serialize to json!");

        self.insert_into_queue(connection, payload, "update", &self.name)
    }

    fn delete(&self, connection: &Connection, row_id: i64) -> Result<(), Error> {
        let payload = json!({
            "id": row_id
        });

        self.insert_into_queue(connection, payload.to_string(), "delete", &self.name)
    }
}
