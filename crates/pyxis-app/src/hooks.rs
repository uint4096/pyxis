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
use pyxis_shared::entities::queue::Source;
use rusqlite::{hooks::Action, Connection, Error};
use snapshots::SnapshotsListener;
use updates::UpdatesListener;
use workspaces::WorkspacesListener;

type ListenerMap = HashMap<String, Box<dyn Listener>>;

fn create_listeners() -> ListenerMap {
    let mut listeners: ListenerMap = HashMap::new();

    listeners.insert(
        Source::Update.to_string(),
        Box::new(UpdatesListener {
            name: Source::Update.to_string(),
        }),
    );
    listeners.insert(
        Source::Snapshot.to_string(),
        Box::new(SnapshotsListener {
            name: Source::Snapshot.to_string(),
        }),
    );
    listeners.insert(
        Source::Workspace.to_string(),
        Box::new(WorkspacesListener {
            name: Source::Workspace.to_string(),
        }),
    );
    listeners.insert(
        Source::File.to_string(),
        Box::new(FilesListener {
            name: Source::File.to_string(),
        }),
    );
    listeners.insert(
        Source::Directory.to_string(),
        Box::new(DirectoryListener {
            name: Source::Directory.to_string(),
        }),
    );

    listeners
}

fn handle_action(
    listener: &dyn Listener,
    action: Action,
    conn: &Connection,
    config_connection: &Connection,
    row_id: i64,
) -> Result<(), Error> {
    match action {
        Action::SQLITE_INSERT => listener.insert(conn, config_connection, row_id),
        Action::SQLITE_UPDATE => listener.update(conn, config_connection, row_id),
        Action::SQLITE_DELETE => listener.delete(conn, config_connection, row_id),
        _ => Ok(()),
    }
}

pub fn content_hook(
    action: Action,
    _: &str,
    table: &str,
    row_id: i64,
    connection: &Connection,
    config_connection: &Connection,
) {
    let listeners = create_listeners();

    if let Some(listener) = listeners.get(table) {
        if let Err(err) = handle_action(
            listener.as_ref(),
            action,
            connection,
            config_connection,
            row_id,
        ) {
            println!("[Listeners] Error: {}", err);
        }
    }
}
