use pyxis_db::entities::queue::ListenerQueue;
use rusqlite::{Connection, Error};

pub trait Listener {
    fn insert_into_queue(
        &self,
        connection: &Connection,
        payload: String,
        op: &str,
        source: &str,
    ) -> Result<(), Error> {
        let elem = ListenerQueue::new(
            None,
            String::from("init"),
            source.to_owned(),
            op.to_owned(),
            payload,
        );
        elem.enqueue(connection)?;

        Ok(())
    }
    fn insert(
        &self,
        connection: &Connection,
        config_connection: &Connection,
        row_id: i64,
    ) -> Result<(), Error>;
    fn update(
        &self,
        connection: &Connection,
        config_connection: &Connection,
        row_id: i64,
    ) -> Result<(), Error>;
    fn delete(
        &self,
        connection: &Connection,
        config_connection: &Connection,
        row_id: i64,
    ) -> Result<(), Error>;
}
