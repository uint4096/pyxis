use super::listener::Listener;
use pyxis_shared::entities::files::Files;
use rusqlite::{Connection, Error};
use serde_json::json;

pub struct FilesListener {
    pub name: String,
}

impl Listener for FilesListener {
    fn insert(
        &self,
        connection: &Connection,
        config_connection: &Connection,
        row_id: i64,
    ) -> Result<(), Error> {
        let payload = serde_json::to_string(&Files::get(connection, row_id)?)
            .expect("[Files Listener] Failed to serialize to json!");

        self.insert_into_queue(config_connection, payload, "insert", &self.name, None, None)
    }

    fn update(
        &self,
        connection: &Connection,
        config_connection: &Connection,
        row_id: i64,
    ) -> Result<(), Error> {
        let payload = serde_json::to_string(&Files::get(connection, row_id)?)
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
