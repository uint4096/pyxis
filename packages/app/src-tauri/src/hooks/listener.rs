use rusqlite::{Connection, Error};

pub trait Listener {
    fn insert_into_queue(
        &self,
        connection: &Connection,
        payload: String,
        op: &str,
        source: &str,
    ) -> Result<(), Error> {
        let insert_sql =
            "INSERT INTO listener_queue (status, source, operation, payload) VALUES (?1, ?2, ?3, ?4)";

        connection.execute(insert_sql, ("init", source, op, &payload))?;

        Ok(())
    }
    fn insert(&self, connection: &Connection, config_connection: &Connection, row_id: i64) -> Result<(), Error>;
    fn update(&self, connection: &Connection, config_connection: &Connection, row_id: i64) -> Result<(), Error>;
    fn delete(&self, connection: &Connection, config_connection: &Connection, row_id: i64) -> Result<(), Error>;
}
