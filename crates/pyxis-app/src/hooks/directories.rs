use pyxis_db::entities::directories::Directory;
use rusqlite::{Connection, Error};
use serde_json::json;

use super::listener::Listener;

pub struct DirectoryListener {
    pub name: String,
}

impl Listener for DirectoryListener {
    fn insert(
        &self,
        connection: &Connection,
        config_connection: &Connection,
        row_id: i64,
    ) -> Result<(), Error> {
        let payload = serde_json::to_string(&Directory::get(connection, row_id)?)
            .expect("[Files Listener] Failed to serialize to json!");

        self.insert_into_queue(config_connection, payload, "insert", &self.name, None, None)
    }

    fn update(
        &self,
        connection: &Connection,
        config_connection: &Connection,
        row_id: i64,
    ) -> Result<(), Error> {
        let payload = serde_json::to_string(&Directory::get(connection, row_id)?)
            .expect("[Files Listener] Failed to serialize to json!");

        self.insert_into_queue(config_connection, payload, "update", &self.name, None, None)
    }

    fn delete(
        &self,
        _: &Connection,
        config_connection: &Connection,
        row_id: i64,
    ) -> Result<(), Error> {
        let payload = json!({
            "id": row_id
        });

        self.insert_into_queue(
            config_connection,
            payload.to_string(),
            "delete",
            &self.name,
            None,
            None,
        )
    }
}
