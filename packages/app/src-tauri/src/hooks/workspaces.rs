use rusqlite::{Connection, Error};
use serde_json::json;

use crate::entities::workspaces::Workspace;

use super::listener::Listener;

pub struct WorkspacesListener {
    pub name: String,
}

impl WorkspacesListener {
    fn get_data(connection: &Connection, row_id: i64) -> Result<Workspace, Error> {
        let mut sql = connection.prepare(
            "SELECT id, uid, name, selected, created_at, updated_at from workspaces WHERE id=?1",
        )?;

        sql.query_row(&[&row_id], |row| -> Result<Workspace, Error> {
            Ok(Workspace {
                id: row.get(0)?,
                uid: row.get(1)?,
                name: row.get(2)?,
                selected: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })
    }
}

impl Listener for WorkspacesListener {
    fn insert(&self, connection: &Connection, config_connection: &Connection, row_id: i64) -> Result<(), Error> {
        let payload = serde_json::to_string(&WorkspacesListener::get_data(connection, row_id)?)
            .expect("[Workspaces Listener] Failed to serialize to json!");

        self.insert_into_queue(config_connection, payload, "insert", &self.name)
    }

    fn update(&self, connection: &Connection, config_connection: &Connection, row_id: i64) -> Result<(), Error> {
        let payload = serde_json::to_string(&WorkspacesListener::get_data(connection, row_id)?)
            .expect("[Workspaces Listener] Failed to serialize to json!");

        self.insert_into_queue(config_connection, payload, "update", &self.name)
    }

    fn delete(&self, _: &Connection, config_connection: &Connection, row_id: i64) -> Result<(), Error> {
        let payload = json!({
            "id": row_id
        });

        self.insert_into_queue(config_connection, payload.to_string(), "delete", &self.name)
    }
}
