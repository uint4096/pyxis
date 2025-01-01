use pyxis_db::{
    entities::{
        queue::{ListenerQueue, Source},
        tracker::Tracker,
    },
    payload::DocumentWritePayload,
};
use reqwest::{Client, Error, Response};
use rusqlite::Connection;
use serde::Deserialize;
use uuid::Uuid;

use super::sync_writer::SyncWriter;

#[derive(Deserialize)]
struct DocumentWriteResponse {
    record_id: i64,
}

pub struct DocumentWriter<'a> {
    pub device_id: Uuid,
    pub conn: &'a Connection,
}

impl<'a> SyncWriter for DocumentWriter<'a> {
    async fn write(
        &self,
        client: &Client,
        queue_element: &ListenerQueue,
        token: String,
    ) -> Result<Response, Error> {
        let last_record = Tracker::get(
            self.conn,
            [Source::Directory, Source::File, Source::Workspace].to_vec(),
            self.device_id,
        )
        .expect("Failed to get last sync record!");

        let update_payload = DocumentWritePayload {
            payload: queue_element.payload.clone(),
            record_id: last_record.record_id + 1,
            operation: queue_element.operation.clone(),
        };

        //@todo use env vars
        client
            .post("http://localhost:8080/sync/document/write")
            .json(&update_payload)
            .header("authorization", format!("Bearer {}", &token))
            .send()
            .await
    }

    async fn post_write(
        conn: &Connection,
        result: Response,
        device_id: Uuid,
        source: Source,
    ) -> Result<(), rusqlite::Error> {
        let update = result
            .json::<DocumentWriteResponse>()
            .await
            .expect("Failed to deserialize update response");

        let record = Tracker::new(None, device_id, source, update.record_id);

        record.add(conn)?;

        Ok(())
    }
}
