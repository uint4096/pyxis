mod directories;
mod files;
mod listener;
mod snapshots;
mod updates;
mod workspaces;

use std::collections::HashMap;

use directories::DirectoryListener;
use files::FilesListener;
use listener::Listener;
use rusqlite::{hooks::Action, Connection, Error};
use snapshots::SnapshotsListener;
use updates::UpdatesListener;
use workspaces::WorkspacesListener;

type ListenerMap = HashMap<&'static str, Box<dyn Listener>>;

fn create_listeners() -> ListenerMap {
    let mut listeners: ListenerMap = HashMap::new();

    listeners.insert(
        "updates",
        Box::new(UpdatesListener {
            name: "updates".into(),
        }),
    );
    listeners.insert(
        "snapshots",
        Box::new(SnapshotsListener {
            name: "snapshots".into(),
        }),
    );
    listeners.insert(
        "workspaces",
        Box::new(WorkspacesListener {
            name: "workspaces".into(),
        }),
    );
    listeners.insert(
        "files",
        Box::new(FilesListener {
            name: "files".into(),
        }),
    );
    listeners.insert(
        "directories",
        Box::new(DirectoryListener {
            name: "directories".into(),
        }),
    );

    listeners
}

fn handle_action(
    listener: &dyn Listener,
    action: Action,
    conn: &Connection,
    row_id: i64,
) -> Result<(), Error> {
    match action {
        Action::SQLITE_INSERT => listener.insert(conn, row_id),
        Action::SQLITE_UPDATE => listener.update(conn, row_id),
        Action::SQLITE_DELETE => listener.delete(conn, row_id),
        _ => Ok(()),
    }
}

pub fn content_hook(action: Action, _: &str, table: &str, row_id: i64, connection: &Connection) {
    let listeners = create_listeners();

    if let Some(listener) = listeners.get(table) {
        if let Err(err) = handle_action(listener.as_ref(), action, connection, row_id) {
            println!("[Listeners] Error: {}", err);
        }
    }
}
