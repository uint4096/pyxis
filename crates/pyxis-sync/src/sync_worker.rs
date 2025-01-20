use std::{cmp::min, thread::sleep, time::Duration};

use pyxis_db::entities::{
    config::Configuration,
    queue::{ListenerQueue, Source},
    tracker::Tracker,
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

        let (user_token, device_id, user_id) = match get_valid_configuration(conn)? {
            Some(config) => config,
            None => {
                eprintln!("Invalid configuration!");
                handle_backoff(&mut sleep_duration);
                continue;
            }
        };

        let last_written_id: i64 = match Tracker::get_last_queue_entry_id(conn, device_id, user_id)
        {
            Ok(id) => id.or(Some(0)).unwrap(),
            Err(e) => {
                eprintln!("Failed to get last send queue entry. Error: {}", e);
                0
            }
        };

        let queue_element = match ListenerQueue::dequeue(conn, last_written_id) {
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
                (DocumentWriter {
                    conn,
                    device_id,
                    user_id,
                })
                .write(&client, &queue_element, user_token)
                .await
            }
        };

        println!("Processing result: {:?}", processing_result);
        let post_write_result: Result<(), rusqlite::Error> = match processing_result {
            Ok((record_id, queue_entry_id)) => {
                if queue_element.source != Source::Update {
                    DocumentWriter::post_write(
                        conn,
                        record_id,
                        queue_entry_id,
                        device_id,
                        user_id,
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

fn get_valid_configuration(conn: &Connection) -> Result<Option<(String, Uuid, Uuid)>, Error> {
    let config = Configuration::get(conn)?;
    match (config.user_token, config.device_id, config.user_id) {
        (Some(token), Some(id), Some(user_id)) => Ok(Some((token, id, user_id))),
        _ => Ok(None),
    }
}

fn handle_backoff(sleep_duration: &mut u64) {
    sleep(Duration::from_secs(*sleep_duration));
    *sleep_duration *= 2;
}
