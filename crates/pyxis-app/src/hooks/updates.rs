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
        let update = Updates::get_by_id(row_id, connection)?;
        let payload = serde_json::to_string(&update)
            .expect("[Updates Listener] Failed to serialize to json!");

        self.insert_into_queue(
            config_connection,
            payload,
            "insert",
            &self.name,
            Some(update.file_uid),
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
