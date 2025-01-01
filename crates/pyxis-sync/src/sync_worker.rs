use std::{thread::sleep, time::Duration};

use pyxis_db::entities::{
    config::Configuration,
    queue::{ListenerQueue, Source},
};
use rusqlite::{Connection, Error};

use crate::writer::{
    document_writer::DocumentWriter, sync_writer::SyncWriter, update_writer::UpdateWriter,
};

pub async fn sync_worker(conn: &Connection) -> Result<(), Error> {
    let client = reqwest::Client::new();
    let mut sleep_duration = 30;

    loop {
        sleep_duration = if sleep_duration > 300 {
            300
        } else {
            sleep_duration
        };

        let config = Configuration::get(conn)?;
        let queue_element = ListenerQueue::dequeue(conn)?;

        if config.user_token.is_none() || config.device_id.is_none() {
            //@todo: handle expired tokens
            sleep(Duration::from_secs(sleep_duration));
            sleep_duration += sleep_duration;
            continue;
        }

        let success = if queue_element.source == Source::Update {
            let update_writer = UpdateWriter {};
            update_writer
                .write(&client, &queue_element, config.user_token.unwrap())
                .await
                .is_err()
        } else {
            let document_writer = DocumentWriter {
                conn: &conn,
                device_id: config.device_id.unwrap(),
            };

            let res = document_writer
                .write(&client, &queue_element, config.user_token.unwrap())
                .await;

            let is_err = res.is_err();
            DocumentWriter::post_write(
                &conn,
                res.unwrap(),
                config.device_id.unwrap(),
                queue_element.source.clone(),
            )
            .await?;
            is_err
        };

        if success {
            queue_element.remove(conn)?;
        } else {
            queue_element.requeue(conn)?;
            sleep(Duration::from_secs(sleep_duration));
            sleep_duration += sleep_duration;
        }
    }
}
