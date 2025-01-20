use pyxis_db::{entities::queue::ListenerQueue, payload::UpdateWritePayload};
use reqwest::{Client, Error};

use super::sync_writer::SyncWriter;

pub struct UpdateWriter {}

impl SyncWriter for UpdateWriter {
    async fn write(
        &self,
        client: &Client,
        queue_element: &ListenerQueue,
        token: String,
    ) -> Result<(i64, i64), Error> {
        let update_payload = UpdateWritePayload {
            file_uid: queue_element
                .file_uid
                .clone()
                .expect("No file id associated with the update"),
            payload: queue_element.payload.clone(),
            snapshot_id: queue_element
                .snapshot_id
                .expect("No snapshot id associated with the update"),
        };

        client
            .post("http://localhost:8080/sync/update/write")
            .json(&update_payload)
            .header("authorization", format!("Bearer {}", &token))
            .send()
            .await?;

        Ok((0, queue_element.id.unwrap()))
    }
}
