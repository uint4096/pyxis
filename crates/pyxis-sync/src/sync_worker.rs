use std::{cmp::min, thread::sleep, time::Duration};

use pyxis_db::entities::{
    config::Configuration,
    queue::{ListenerQueue, Source},
};
use rusqlite::{Connection, Error};

use crate::writer::{
    document_writer::DocumentWriter, sync_writer::SyncWriter, update_writer::UpdateWriter,
};

const MAX_SLEEP_DURATION: u64 = 300;

pub async fn sync_worker(conn: &Connection) -> Result<(), Error> {
    let client = reqwest::Client::new();
    let mut sleep_duration = 30;

    loop {
        sleep_duration = min(sleep_duration, MAX_SLEEP_DURATION);

        let config = Configuration::get(conn)?;
        let queue_element = match ListenerQueue::dequeue(conn) {
            Ok(elem) => elem,
            Err(Error::QueryReturnedNoRows) => {
                continue;
            }
            Err(e) => {
                println!("Failed to dequeue. Error: {}", e);
                sleep(Duration::from_secs(sleep_duration));
                sleep_duration *= 2;
                continue;
            }
        };

        let (user_token, device_id) = match (config.user_token, config.device_id) {
            (Some(token), Some(id)) => (token, id),
            _ => {
                sleep(Duration::from_secs(sleep_duration));
                sleep_duration *= 2;
                continue;
            }
        };

        let processing_result: Result<(), Error> = match queue_element.source {
            Source::Update => {
                let _ = match (UpdateWriter {}).write(&client, &queue_element, user_token)
                .await {
                    Ok(_) => (),
                    Err(_) => {
                        queue_element.requeue(conn)?;
                        sleep(Duration::from_secs(sleep_duration));
                        sleep_duration *= 2;
                        continue; 
                    }
                };

                Ok(())
            }
            _ => {
                let document_writer = DocumentWriter { conn, device_id };

                match document_writer
                .write(&client, &queue_element, user_token)
                .await  {
                    Ok(write_result) => {
                        DocumentWriter::post_write(
                            conn,
                            write_result,
                            device_id,
                            queue_element.source.clone(),
                        )
                        .await?
                    },
                    Err(_) => {
                        queue_element.requeue(conn)?;
                        sleep(Duration::from_secs(sleep_duration));
                        sleep_duration *= 2;
                        continue;
                    }
                };

                Ok(())
            }
        };

        match processing_result {
            Ok(_) => {
                queue_element.remove(conn)?;
                sleep_duration = 30;
            }
            Err(_) => {
                queue_element.requeue(conn)?;
                sleep(Duration::from_secs(sleep_duration));
                sleep_duration *= 2;
            }
        }
    }
}
