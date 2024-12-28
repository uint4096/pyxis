use rusqlite::{Connection, Error};
use serde_json::json;

use crate::entities::files::FilesRaw;

use super::listener::Listener;

pub struct FilesListener {
    pub name: String,
}

impl FilesListener {
    fn get_data(connection: &Connection, row_id: i64) -> Result<FilesRaw, Error> {
        let mut sql = connection
                .prepare("SELECT id, uid, dir_id, workspace_id, path, title, created_at, updated_at, links, tags from files WHERE id=?1")?;

        sql.query_row(&[&row_id], |row| -> Result<FilesRaw, Error> {
            Ok(FilesRaw {
                id: row.get(0)?,
                uid: row.get(1)?,
                dir_id: row.get(2)?,
                workspace_id: row.get(3)?,
                path: row.get(4)?,
                title: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
                links: row.get(8)?,
                tags: row.get(9)?,
            })
        })
    }
}

impl Listener for FilesListener {
    fn insert(&self, connection: &Connection, row_id: i64) -> Result<(), Error> {
        let payload = serde_json::to_string(&FilesListener::get_data(connection, row_id)?)
            .expect("[Files Listener] Failed to serialize to json!");

        self.insert_into_queue(connection, payload, "insert", &self.name)
    }

    fn update(&self, connection: &Connection, row_id: i64) -> Result<(), Error> {
        let payload = serde_json::to_string(&FilesListener::get_data(connection, row_id)?)
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
