use chrono::Utc;
use pyxis_db::{
    database::Database,
    entities::files::{Files, Link},
};
use tauri::State;

#[tauri::command]
pub fn create_file(
    title: String,
    dir_uid: Option<String>,
    path: String,
    workspace_uid: String,
    links: Vec<Link>,
    tags: Vec<String>,
    created_at: Option<String>,
    updated_at: Option<String>,
    uid: Option<String>,
    database: State<Database>,
) -> Option<Files> {
    let file = Files::new(dir_uid, path, title, tags, links, workspace_uid, None, created_at, updated_at, uid);

    match file.create(&database.get_connection()) {
        Ok(_) => Some(file),
        Err(e) => {
            eprintln!("[Files] Failed to create! {}", e);
            None
        }
    }
}

#[tauri::command]
pub fn list_files(
    workspace_uid: String,
    dir_uid: Option<String>,
    database: State<Database>,
) -> Option<Vec<Files>> {
    match Files::list(&database.get_connection(), workspace_uid, dir_uid) {
        Ok(directories) => Some(directories),
        Err(e) => {
            eprintln!("[Files] Failed to fetch! Error: {e}");
            None
        }
    }
}

#[tauri::command]
pub fn delete_file(uid: String, database: State<Database>) -> bool {
    match Files::delete(uid, &database.get_connection()) {
        Ok(_) => true,
        Err(e) => {
            eprintln!("[Files] Failed to delete! {}", e);
            false
        }
    }
}

#[tauri::command]
pub fn update_file(
    uid: String,
    title: String,
    dir_uid: Option<String>,
    workspace_uid: String,
    path: String,
    links: Vec<Link>,
    tags: Vec<String>,
    database: State<Database>,
) -> Option<Files> {
    let conn = &database.get_connection();
    let file = match Files::list(conn, workspace_uid, dir_uid.clone()) {
        Ok(f) => f.into_iter().find(|f| f.uid == uid),
        Err(e) => {
            eprintln!("[Files] Failed to get for update! {}", e);
            None
        }
    };

    if let Some(mut file) = file {
        file.title = title;
        file.dir_uid = dir_uid;
        file.path = path;
        file.links = links;
        file.tags = tags;
        file.updated_at = Utc::now().to_rfc3339();

        match file.update(conn) {
            Ok(_) => {
                return Some(file);
            }
            Err(e) => {
                eprintln!("[Files] Failed to update! {}", e);
                return None;
            }
        }
    }

    None
}

#[tauri::command]
pub fn get_file_id(path: String, workspace_uid: String, database: State<Database>) -> Option<i64> {
    match Files::get_by_path(&database.get_connection(), path, workspace_uid) {
        Ok(file_id) => Some(file_id),
        Err(e) => {
            eprintln!("[Files] Failed to fetch id! Error: {e}");
            None
        }
    }
}
