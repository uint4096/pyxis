use pyxis_db::entities::queue::{ListenerQueue, Source};
use reqwest::{Client, Error};
use rusqlite::Connection;
use uuid::Uuid;

pub trait SyncWriter {
    async fn write(
        &self,
        client: &Client,
        element: &ListenerQueue,
        token: String,
    ) -> Result<(i64, i64), Error>;

    async fn post_write(
        _conn: &Connection,
        _record_id: i64,
        _queue_entry_id: i64,
        _device_id: Uuid,
        _user_id: Uuid,
        _source: Source,
    ) -> Result<(), rusqlite::Error> {
        Ok(())
    }
}
