use super::listener::Listener;
use pyxis_db::entities::updates::Updates;
use rusqlite::{Connection, Error};

pub struct UpdatesListener {
    pub name: String,
}

impl Listener for UpdatesListener {
    fn insert(
        &self,
        connection: &Connection,
        config_connection: &Connection,
        row_id: i64,
    ) -> Result<(), Error> {
        let mut sql = connection.prepare(
            "SELECT content, snapshot_id, file_id, updated_at, id from updates where id=?1",
        )?;

        let update = sql.query_row(&[&row_id], |row| -> Result<Updates, Error> {
            let update = Updates {
                content: row.get(0)?,
                snapshot_id: row.get(1)?,
                file_id: row.get(2)?,
                updated_at: row.get(3)?,
                id: row.get(4)?,
            };

            Ok(update)
        })?;

        let payload = serde_json::to_string(&update)
            .expect("[Updates Listener] Failed to serialize to json!");

        self.insert_into_queue(
            config_connection,
            payload,
            "insert",
            &self.name,
            Some(update.file_id),
            Some(update.snapshot_id),
        )
    }

    fn update(&self, _: &Connection, _: &Connection, _: i64) -> Result<(), Error> {
        Ok(())
    }

    fn delete(&self, _: &Connection, _: &Connection, _: i64) -> Result<(), Error> {
        Ok(())
    }
}
