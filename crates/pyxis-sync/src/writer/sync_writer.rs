use pyxis_db::entities::queue::{ListenerQueue, Source};
use reqwest::{Client, Error, Response};
use rusqlite::Connection;
use uuid::Uuid;

pub trait SyncWriter {
    async fn write(
        &self,
        client: &Client,
        element: &ListenerQueue,
        token: String,
    ) -> Result<Response, Error>;

    async fn post_write(
        _conn: &Connection,
        _res: Response,
        _device_id: Uuid,
        _source: Source,
    ) -> Result<(), rusqlite::Error> {
        Ok(())
    }
}
