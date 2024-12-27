use rusqlite::{hooks::Action, Connection, Error};

use crate::entities::{snapshots::Snapshots, updates::Updates};

pub fn content_hook (action: Action, _: &str, table: &str, row_id: i64, connection: &Connection) {
    match table {
        "updates" => {
            println!("Executing updates callback");
            if action != Action::SQLITE_INSERT {
                return;
            }

            let mut sql = connection
                .prepare("SELECT content, snapshot_id, file_id, updated_at, id from updates where id=?1")
                .expect("Failed to prepare statement");

            let update = sql.query_row(&[&row_id], |row| -> Result<Updates, Error> {
                Ok(Updates {
                    content: row.get(0)?,
                    snapshot_id: row.get(1)?,
                    file_id: row.get(2)?,
                    updated_at: row.get(3)?,
                    id: row.get(4)?,
                })
            }).unwrap();

            println!("{:?}", update);
        },
        "snapshots" => {
            if action == Action::SQLITE_DELETE {
                return;
            }

            let mut sql = connection
                .prepare("SELECT content, snapshot_id, file_id, updated_at, id from snapshots where id=?1")
                .expect("Failed to prepare statement");

            let snapshot = sql.query_row(&[&row_id], |row| -> Result<Snapshots, Error> {
                Ok(Snapshots {
                    content: row.get(0)?,
                    snapshot_id: row.get(1)?,
                    file_id: row.get(2)?,
                    updated_at: row.get(3)?,
                    id: row.get(4)?,
                })
            }).unwrap();

            println!("{:?}", snapshot);
        },
        _ => {}
    };
}
