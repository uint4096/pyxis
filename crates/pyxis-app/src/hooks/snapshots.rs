use super::listener::Listener;
use pyxis_db::entities::snapshots::Snapshots;
use rusqlite::{Connection, Error};

pub struct SnapshotsListener {
    pub name: String,
}

impl Listener for SnapshotsListener {
    fn insert(
        &self,
        connection: &Connection,
        config_connection: &Connection,
        row_id: i64,
    ) -> Result<(), Error> {
        let payload = serde_json::to_string(&Snapshots::get_by_id(connection, row_id)?)
            .expect("[Snapshot Listener] Failed to serialize to json!");

        self.insert_into_queue(config_connection, payload, "insert", &self.name, None, None)
    }

    fn update(
        &self,
        connection: &Connection,
        config_connection: &Connection,
        row_id: i64,
    ) -> Result<(), Error> {
        let payload = serde_json::to_string(&Snapshots::get_by_id(connection, row_id)?)
            .expect("[Snapshot Listener] Failed to serialize to json!");
    
        self.insert_into_queue(config_connection, payload, "update", &self.name, None, None)
    }

    fn delete(&self, _: &Connection, _: &Connection, _: i64) -> Result<(), Error> {
        Ok(())
    }
}
