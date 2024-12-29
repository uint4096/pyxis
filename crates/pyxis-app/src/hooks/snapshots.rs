use pyxis_db::entities::snapshots::Snapshots;
use rusqlite::{Connection, Error};
use super::listener::Listener;

pub struct SnapshotsListener {
    pub name: String,
}

impl SnapshotsListener {
    fn get_data(connection: &Connection, row_id: i64) -> Result<Snapshots, Error> {
        let mut sql = connection
                .prepare("SELECT id, uid, dir_id, workspace_id, path, title, created_at, updated_at, links, tags from files WHERE id=?1")?;

        sql.query_row(&[&row_id], |row| -> Result<Snapshots, Error> {
            Ok(Snapshots {
                content: row.get(0)?,
                snapshot_id: row.get(1)?,
                file_id: row.get(2)?,
                updated_at: row.get(3)?,
                id: row.get(4)?,
            })
        })
    }
}

impl Listener for SnapshotsListener {
    fn insert(&self, connection: &Connection, config_connection: &Connection, row_id: i64) -> Result<(), Error> {
        let payload = serde_json::to_string(&SnapshotsListener::get_data(connection, row_id)?)
            .expect("[Snapshot Listener] Failed to serialize to json!");
    
        self.insert_into_queue(config_connection, payload, "insert", &self.name)
    }

    fn update(&self, connection: &Connection, config_connection: &Connection, row_id: i64) -> Result<(), Error> {
        let payload = serde_json::to_string(&SnapshotsListener::get_data(connection, row_id)?)
            .expect("[Snapshot Listener] Failed to serialize to json!");
    
        self.insert_into_queue(config_connection, payload, "update", &self.name)
    }

    fn delete(&self, _: &Connection, _: &Connection, _: i64) -> Result<(), Error> {
        Ok(())
    }
}
