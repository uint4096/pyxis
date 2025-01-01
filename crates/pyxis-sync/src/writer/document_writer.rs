use pyxis_db::{
    entities::queue::ListenerQueue,
    payload::{DocumentWritePayload, UpdateWritePayload},
};
use reqwest::{Client, Error, Response};
use serde::Deserialize;

use super::sync_writer::SyncWriter;

#[derive(Deserialize)]
struct DocumentWriteResponse {
    record_id: i64,
}

pub struct DocumentWriter;

impl SyncWriter for DocumentWriter {
    async fn write(
        client: &Client,
        queue_element: &ListenerQueue,
        token: String,
    ) -> Result<Response, Error> {
        let update_payload = DocumentWritePayload {
            payload: queue_element.payload.clone(),
            record_id: 0,
            operation: queue_element.operation.clone(),
        };

        client
            .post("http://localhost:8080/sync/document/write")
            .json(&update_payload)
            .header("authorization", format!("Bearer {}", &token))
            .send()
            .await
    }

    async fn post_write(result: Response) -> Result<(), rusqlite::Error> {
        let update = result
            .json::<DocumentWriteResponse>()
            .await
            .expect("Failed to deserialize update response");

        Ok(())
    }
}
