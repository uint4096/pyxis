use chrono::Utc;
use pyxis_db::{database::Database, entities::workspaces::Workspace};
use tauri::State;

#[tauri::command]
pub fn create_workspace(
    name: String,
    selected: bool,
    database: State<Database>,
) -> Option<Workspace> {
    let workspace = Workspace::new(name, selected, None);

    match workspace.create(&database.get_connection()) {
        Ok(_) => Some(workspace),
        Err(e) => {
            eprintln!("[Workspaces] Failed to create! {}", e);
            None
        }
    }
}

#[tauri::command]
pub fn list_workspaces(database: State<Database>) -> Option<Vec<Workspace>> {
    match Workspace::list(&database.get_connection()) {
        Ok(workspaces) => Some(workspaces),
        Err(e) => {
            eprintln!("[Workspaces] Failed to fetch! Error: {e}");
            None
        }
    }
}

#[tauri::command]
pub fn delete_workspace(uid: String, database: State<Database>) -> bool {
    match Workspace::delete(uid, &database.get_connection()) {
        Ok(_) => true,
        Err(e) => {
            eprintln!("[Workspaces] Failed to delete! {}", e);
            false
        }
    }
}

#[tauri::command]
pub fn update_workspace(
    uid: String,
    name: String,
    selected: bool,
    database: State<Database>,
) -> Option<Workspace> {
    let conn = &database.get_connection();
    let workspace = match Workspace::list(conn) {
        Ok(w) => w.into_iter().find(|w| w.uid == uid),
        Err(e) => {
            eprintln!("[Workspaces] Failed to get for update! {}", e);
            None
        }
    };

    if let Some(mut workspace) = workspace {
        workspace.name = name;
        workspace.selected = selected;
        workspace.updated_at = Utc::now().to_rfc3339();

        match workspace.update(conn) {
            Ok(_) => {
                return Some(workspace);
            }
            Err(e) => {
                eprintln!("[Workspaces] Failed to update! {}", e);
                return None;
            }
        }
    }

    None
}
