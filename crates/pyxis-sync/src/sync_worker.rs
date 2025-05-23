use procfs::process::Process;
use std::{cmp::min, str::FromStr, thread::sleep, time::Duration};
use tauri_plugin_http::reqwest;

use pyxis_shared::entities::{
    config::{ConfigEntry, Features},
    queue::{ListenerQueue, Source},
    tracker::Tracker,
};
use rusqlite::{Connection, Error};
use uuid::Uuid;

use crate::writer::{
    document_writer::DocumentWriter, sync_writer::SyncWriter, update_writer::UpdateWriter,
};

const MAX_SLEEP_DURATION: u64 = 100;

pub async fn sync_worker(conn: &Connection, pid: Option<i32>) -> Result<(), Error> {
    let client = reqwest::Client::new();
    let mut sleep_duration = 10;

    loop {
        if !pid.is_none() && Process::new(pid.unwrap()).is_err() {
            println!(
                "Main process no longer exists! Process Id: {}",
                pid.unwrap()
            );
            std::process::exit(0);
        }

        sleep_duration = min(sleep_duration, MAX_SLEEP_DURATION);

        let (user_token, device_id, user_id, features) = match get_valid_configuration(conn)? {
            Some(config) => config,
            None => {
                eprintln!("Invalid configuration!");
                handle_backoff(&mut sleep_duration);
                continue;
            }
        };

        if let Some(feature) = features {
            let sync = feature.get("sync");
            if sync.is_none() || !sync.unwrap().0 || sync.unwrap().1 != String::from("enabled") {
                eprintln!("Sync disabled!");
                handle_backoff(&mut sleep_duration);
                continue;
            }
        }

        let last_written_id: i64 = match Tracker::get_last_queue_entry_id(conn, device_id, user_id)
        {
            Ok(id) => id.or(Some(0)).unwrap(),
            Err(e) => {
                eprintln!("Failed to get last sent queue entry. Error: {}", e);
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
                } else {
                    UpdateWriter::post_write(
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

fn get_valid_configuration(
    conn: &Connection,
) -> Result<Option<(String, Uuid, Uuid, Option<Features>)>, Error> {
    match ConfigEntry::get_logged_in_user(conn) {
        Ok(config) => {
            match (
                config.user_token,
                config.device_id,
                config.user_id,
                config.features,
            ) {
                (Some(token), Some(id), user_id, features) => Ok(Some((
                    token,
                    id,
                    Uuid::from_str(&user_id).unwrap(),
                    features,
                ))),
                _ => Ok(None),
            }
        }
        Err(e) => {
            eprintln!("[Worker] Failed to get config! Error: {}", e);
            Ok(None)
        }
    }
}

fn handle_backoff(sleep_duration: &mut u64) {
    sleep(Duration::from_secs(*sleep_duration));
    *sleep_duration *= 2;
}
