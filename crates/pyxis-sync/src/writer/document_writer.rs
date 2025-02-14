use std::env;

use pyxis_shared::{
    entities::{
        queue::{ListenerQueue, Source},
        tracker::Tracker,
    },
    payload::DocumentWritePayload,
};
use tauri_plugin_http::reqwest::{Client, Error};
use rusqlite::Connection;
use uuid::Uuid;

use super::sync_writer::SyncWriter;

pub struct DocumentWriter<'a> {
    pub device_id: Uuid,
    pub user_id: Uuid,
    pub conn: &'a Connection,
}

impl<'a> SyncWriter for DocumentWriter<'a> {
    async fn write(
        &self,
        client: &Client,
        queue_element: &ListenerQueue,
        token: String,
    ) -> Result<(i64, i64), Error> {
        let sources = if queue_element.source == Source::Snapshot {
            [Source::Snapshot].to_vec()
        } else {
            [Source::Directory, Source::File, Source::Workspace].to_vec()
        };

        let last_record = match Tracker::get(self.conn, sources, self.device_id, self.user_id) {
            Ok(record) => record,
            Err(rusqlite::Error::QueryReturnedNoRows) => Tracker {
                record_id: 0,
                device_id: self.device_id,
                id: None,
                source: queue_element.source.clone(),
                user_id: self.user_id,
                queue_entry_id: queue_element.id,
            },
            Err(e) => {
                println!("Error while trying to get tracked records {}", e);
                Tracker {
                    record_id: 0,
                    device_id: self.device_id,
                    id: None,
                    source: queue_element.source.clone(),
                    user_id: self.user_id,
                    queue_entry_id: queue_element.id,
                }
            }
        };

        let update_payload = DocumentWritePayload {
            payload: queue_element.payload.clone(),
            record_id: last_record.record_id + 1,
            operation: queue_element.operation.clone(),
            source: queue_element.source.to_string(),
            file_uid: queue_element.file_uid.clone(),
        };

        let base_url = env!("APP_BASE_URL");

        let response = client
            .post(format!("{}/sync/document/write", base_url))
            .json(&update_payload)
            .header("authorization", format!("Bearer {}", &token))
            .send()
            .await?;

        match response.error_for_status() {
            Ok(_) => {
                return Ok((last_record.record_id + 1, queue_element.id.unwrap()));
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
