use std::str::FromStr;

use rusqlite::{params_from_iter, Connection, Error, ToSql};
use serde::{Deserialize, Serialize};
use serde_with::serde_as;
use uuid::Uuid;

use super::queue::Source;

#[serde_as]
#[derive(Serialize, Deserialize, Debug)]
pub struct Tracker {
    pub id: Option<i64>,
    pub device_id: Uuid,
    pub source: Source,
    pub record_id: i64,
    pub user_id: Uuid,
    pub queue_entry_id: Option<i64>
}

impl Tracker {
    pub fn new(
        id: Option<i64>,
        device_id: Uuid,
        source: Source,
        record_id: i64,
        user_id: Uuid,
        queue_entry_id: Option<i64>
    ) -> Self {
        Self {
            id,
            source,
            device_id,
            record_id,
            user_id,
            queue_entry_id
        }
    }

    pub fn get_last_queue_entry_id(
        conn: &Connection,
        device_id: Uuid,
        user_id: Uuid
    ) -> Result<Option<i64>, Error> {
        let query = format!(
            "SELECT queue_entry_id\
            FROM tracker\
            WHERE device_id=?1 AND user_id=?2\
            ORDER BY record_id DESC LIMIT 1",
        );
        let mut stmt = conn.prepare(&query)?;

        stmt.query_row((&device_id.to_string(), &user_id.to_string()), |row| {
            Ok(row.get(0)?)
        })
    }

    pub fn get(
        conn: &Connection,
        sources: Vec<Source>,
        device_id: Uuid,
        user_id: Uuid,
    ) -> Result<Tracker, Error> {
        let sources: Vec<String> = sources.iter().map(|source| source.to_string()).collect();

        let placeholders: Vec<String> = (0..sources.len()).map(|i| format!("?{}", i + 3)).collect();
        let placeholders = placeholders.join(",");

        let query = format!(
            "SELECT id, record_id, device_id, source, user_id, queue_entry_id\
            FROM tracker\
            WHERE device_id=?1 AND user_id=?2 AND source in ({})\
            ORDER BY record_id DESC LIMIT 1",
            placeholders
        );
        let mut stmt = conn.prepare(&query)?;

        let mut params: Vec<Box<dyn ToSql>> = vec![Box::new(device_id.to_string()), Box::new(user_id.to_string())];
        params.extend(
            sources
                .iter()
                .map(|source| Box::new(source.as_str()) as Box<dyn ToSql>),
        );

        stmt.query_row(params_from_iter(params), |row| {
            let device_id: String = row.get(2)?;
            let source: String = row.get(3)?;
            let user_id: String = row.get(4)?;

            Ok(Tracker {
                id: row.get(0)?,
                record_id: row.get(1)?,
                device_id: Uuid::from_str(&device_id)
                    .expect("Failed to serialize uuid from string"),
                source: Source::from_str(&source).expect("Failed to serialize source from string!"),
                user_id: Uuid::from_str(&user_id).expect("Failed to serialize uuid from string"),
                queue_entry_id: row.get(5)?,
            })
        })
    }

    pub fn add(&self, conn: &Connection) -> Result<(), Error> {
        // Unique constraint on (source, device_id). Replaced on conflict
        let insert_sql = "INSERT INTO tracker (source, device_id, record_id, user_id) VALUES (?1, ?2, ?3, ?4)";

        conn.execute(
            &insert_sql,
            (
                &self.source.to_string(),
                &self.device_id.to_string(),
                &self.record_id,
                &self.user_id.to_string(),
            ),
        )?;

        Ok(())
    }
}
