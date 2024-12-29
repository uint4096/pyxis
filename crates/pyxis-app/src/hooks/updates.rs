use rusqlite::{Connection, Error};

use crate::entities::updates::Updates;

use super::listener::Listener;

pub struct UpdatesListener {
    pub name: String,
}

impl Listener for UpdatesListener {
    fn insert(&self, connection: &Connection, config_connection: &Connection, row_id: i64) -> Result<(), Error> {
        let mut sql = connection.prepare(
            "SELECT content, snapshot_id, file_id, updated_at, id from updates where id=?1",
        )?;

        let payload = sql.query_row(&[&row_id], |row| -> Result<String, Error> {
            let update = Updates {
                content: row.get(0)?,
                snapshot_id: row.get(1)?,
                file_id: row.get(2)?,
                updated_at: row.get(3)?,
                id: row.get(4)?,
            };

            Ok(serde_json::to_string(&update)
                .expect("[Updates Listener] Failed to serialize to json!"))
        })?;

        self.insert_into_queue(config_connection, payload, "insert", &self.name)
    }

    fn update(&self, _: &Connection, _: &Connection, _: i64) -> Result<(), Error> {
        Ok(())
    }

    fn delete(&self, _: &Connection, _: &Connection, _: i64) -> Result<(), Error> {
        Ok(())
    }
}
