use chrono::Utc;
use pyxis_db::{database::Database, entities::directories::Directory};
use tauri::State;

#[tauri::command]
pub fn create_dir(
    name: String,
    workspace_uid: String,
    path: String,
    parent_uid: Option<String>,
    created_at: Option<String>,
    updated_at: Option<String>,
    uid: Option<String>,
    database: State<Database>,
) -> Option<Directory> {
    let directory = Directory::new(name, workspace_uid, path, parent_uid, None, created_at, updated_at, uid);

    match directory.create(&database.get_connection()) {
        Ok(_) => Some(directory),
        Err(e) => {
            eprintln!("[Directories] Failed to create! {}", e);
            None
        }
    }
}

#[tauri::command]
pub fn list_dirs(
    workspace_uid: String,
    parent_uid: Option<String>,
    database: State<Database>,
) -> Option<Vec<Directory>> {
    match Directory::list(&database.get_connection(), workspace_uid, parent_uid) {
        Ok(directories) => Some(directories),
        Err(e) => {
            eprintln!("[Directories] Failed to fetch! Error: {e}");
            None
        }
    }
}

#[tauri::command]
pub fn delete_dir(uid: String, database: State<Database>) -> bool {
    match Directory::delete(uid, &database.get_connection()) {
        Ok(_) => true,
        Err(e) => {
            eprintln!("[Directories] Failed to delete! {}", e);
            false
        }
    }
}

#[tauri::command]
pub fn update_dir(
    id: i32,
    name: String,
    workspace_uid: String,
    path: String,
    parent_uid: Option<String>,
    database: State<Database>,
) -> Option<Directory> {
    let conn = &database.get_connection();
    let directory = match Directory::list(conn, workspace_uid.clone(), parent_uid.clone()) {
        Ok(w) => w.into_iter().find(|w| w.id == Some(id)),
        Err(e) => {
            eprintln!("[Directories] Failed to get for update! {}", e);
            None
        }
    };

    if let Some(mut dir) = directory {
        dir.name = name;
        dir.workspace_uid = workspace_uid;
        dir.path = path;
        dir.parent_uid = parent_uid;
        dir.updated_at = Utc::now().to_rfc3339();

        match dir.update(conn) {
            Ok(_) => {
                return Some(dir);
            }
            Err(e) => {
                eprintln!("[Directories] Failed to update! {}", e);
                return None;
            }
        }
    }

    None
}

#[tauri::command]
pub fn get_directory_id(
    path: String,
    workspace_uid: String,
    database: State<Database>,
) -> Option<i64> {
    match Directory::get_by_path(&database.get_connection(), path, workspace_uid) {
        Ok(directory_id) => Some(directory_id),
        Err(e) => {
            eprintln!("[Directory] Failed to fetch id! Error: {e}");
            None
        }
    }
}
