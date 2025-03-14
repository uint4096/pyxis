use std::env;

use pyxis_shared::{
    entities::{
        queue::{ListenerQueue, Source},
        tracker::Tracker,
    },
    payload::UpdateWritePayload,
};
use tauri_plugin_http::reqwest::{Client, Error};

use super::sync_writer::SyncWriter;
use rusqlite::Connection;
use uuid::Uuid;

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

        let base_url = env!("APP_BASE_URL");

        let response = client
            .post(format!("{}/sync/update/write", base_url))
            .json(&update_payload)
            .header("authorization", format!("Bearer {}", &token))
            .send()
            .await?;

        match response.error_for_status() {
            Ok(_) => {
                return Ok((0, queue_element.id.unwrap()));
            }
            Err(e) => {
                return Err(e);
            }
        }
    }

    async fn post_write(
        conn: &Connection,
        record_id: i64,
        queue_entry_id: i64,
        device_id: Uuid,
        user_id: Uuid,
        source: Source,
    ) -> Result<(), rusqlite::Error> {
        let record = Tracker::new(
            None,
            device_id,
            source,
            record_id,
            user_id,
            Some(queue_entry_id),
        );

        record.add(conn)?;

        Ok(())
    }
}
