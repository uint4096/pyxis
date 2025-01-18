use std::{cmp::min, thread::sleep, time::Duration};

use pyxis_db::entities::{
    config::Configuration,
    queue::{ListenerQueue, Source},
};
use rusqlite::{Connection, Error};
use uuid::Uuid;

use crate::writer::{
    document_writer::DocumentWriter, sync_writer::SyncWriter, update_writer::UpdateWriter,
};

const MAX_SLEEP_DURATION: u64 = 300;

pub async fn sync_worker(conn: &Connection) -> Result<(), Error> {
    let client = reqwest::Client::new();
    let mut sleep_duration = 30;

    loop {
        sleep_duration = min(sleep_duration, MAX_SLEEP_DURATION);

        let (user_token, device_id) = match get_valid_configuration(conn)? {
            Some(config) => config,
            None => {
                eprintln!("Invalid configuration!");
                handle_backoff(&mut sleep_duration);
                continue;
            }
        };

        let queue_element = match ListenerQueue::dequeue(conn) {
            Ok(elem) => elem,
            Err(Error::QueryReturnedNoRows) => {
                continue;
            }
            Err(e) => {
                eprintln!("Failed to dequeue. Error: {}", e);
                handle_backoff(&mut sleep_duration);
                continue;
            }
        };

        let processing_result = match queue_element.source {
            Source::Update => {
                (UpdateWriter {})
                    .write(&client, &queue_element, user_token)
                    .await
            }
            _ => {
                (DocumentWriter { conn, device_id })
                    .write(&client, &queue_element, user_token)
                    .await
            }
        };

        println!("Processing result: {:?}", processing_result);
        let post_write_result: Result<(), rusqlite::Error> = match processing_result {
            Ok(write_result) => {
                if queue_element.source != Source::Update {
                    DocumentWriter::post_write(
                        conn,
                        write_result,
                        device_id,
                        queue_element.source.clone(),
                    )
                    .await?
                }

                Ok(())
            }
            Err(e) => {
                eprintln!("[Post Write] Error: {}", e);
                queue_element.requeue(conn)?;
                handle_backoff(&mut sleep_duration);
                continue;
            }
        };

        match post_write_result {
            Ok(_) => {
                queue_element.remove(conn)?;
                sleep_duration = 30;
            }
            Err(e) => {
                eprintln!("[Post Processing] Error: {}", e);
                queue_element.requeue(conn)?;
                handle_backoff(&mut sleep_duration);
            }
        }
    }
}

fn get_valid_configuration(conn: &Connection) -> Result<Option<(String, Uuid)>, Error> {
    let config = Configuration::get(conn)?;
    match (config.user_token, config.device_id) {
        (Some(token), Some(id)) => Ok(Some((token, id))),
        _ => Ok(None),
    }
}

fn handle_backoff(sleep_duration: &mut u64) {
    sleep(Duration::from_secs(*sleep_duration));
    *sleep_duration *= 2;
}
