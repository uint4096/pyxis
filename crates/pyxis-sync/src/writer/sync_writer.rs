use pyxis_db::entities::queue::ListenerQueue;
use reqwest::{Client, Error, Response};

pub trait SyncWriter {
    async fn write(
        client: &Client,
        element: &ListenerQueue,
        token: String,
    ) -> Result<Response, Error>;
    async fn post_write(_: Response) -> Result<(), rusqlite::Error> {
        Ok(())
    }
}
