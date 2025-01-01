use super::listener::Listener;
use pyxis_db::entities::workspaces::Workspace;
use rusqlite::{Connection, Error};
use serde_json::json;

pub struct WorkspacesListener {
    pub name: String,
}

impl Listener for WorkspacesListener {
    fn insert(
        &self,
        connection: &Connection,
        config_connection: &Connection,
        row_id: i64,
    ) -> Result<(), Error> {
        let payload = serde_json::to_string(&Workspace::get(connection, row_id)?)
            .expect("[Workspaces Listener] Failed to serialize to json!");

        self.insert_into_queue(config_connection, payload, "insert", &self.name)
    }

    fn update(
        &self,
        connection: &Connection,
        config_connection: &Connection,
        row_id: i64,
    ) -> Result<(), Error> {
        let payload = serde_json::to_string(&Workspace::get(connection, row_id)?)
            .expect("[Workspaces Listener] Failed to serialize to json!");

        self.insert_into_queue(config_connection, payload, "update", &self.name)
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

        self.insert_into_queue(config_connection, payload.to_string(), "delete", &self.name)
    }
}
