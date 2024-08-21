use chrono::Utc;
use rusqlite::{Connection, Error, Result, Row};
use tauri::State;

use crate::database::Database;

#[derive(serde::Serialize, serde::Deserialize)]
pub struct Directory {
    id: Option<i32>,
    name: String,
    workspace_id: i32,
    created_at: String,
    updated_at: String,
    path: String,
    parent_id: Option<i32>,
}

impl Directory {
    fn new(
        name: String,
        workspace_id: i32,
        path: String,
        parent_id: Option<i32>,
        id: Option<i32>,
    ) -> Self {
        let current_time = Utc::now().to_rfc3339();

        Self {
            id,
            workspace_id,
            name,
            path,
            parent_id,
            created_at: String::from(&current_time),
            updated_at: String::from(&current_time),
        }
    }

    fn create(&self, conn: &Connection) -> Result<(), Error> {
        let sql = "INSERT INTO directories (name, workspace_id, path, parent_id, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)";

        conn.execute(
            sql,
            (
                &self.name,
                &self.workspace_id,
                &self.path,
                &self.parent_id,
                &self.created_at,
                &self.updated_at,
            ),
        )?;

        Ok(())
    }

    fn list(
        conn: &Connection,
        workspace_id: i32,
        parent_id: Option<i32>,
    ) -> Result<Vec<Self>, Error> {
        let mut stmt =
            match parent_id {
                Some(_) => conn.prepare("SELECT id, name, workspace_id, path, parent_id, created_at, updated_at from directories WHERE workspace_id = ?1 AND parent_id = ?2")?,
                None => conn.prepare("SELECT id, name, workspace_id, path, parent_id, created_at, updated_at from directories WHERE workspace_id = ?1 AND parent_id IS NULL")?
            };

        let handler = |row: &Row| -> Result<Directory> {
            Ok(Directory {
                id: row.get(0)?,
                name: row.get(1)?,
                workspace_id: row.get(2)?,
                path: row.get(3)?,
                parent_id: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        };

        let dir_iter = match parent_id {
            Some(p_id) => stmt.query_map(&[&workspace_id, &p_id], handler)?,
            None => stmt.query_map(&[&workspace_id], handler)?,
        };

        let directories: Vec<Directory> = dir_iter
            .map(|result| result.expect("[Directories] Error while mapping rows"))
            .collect();

        Ok(directories)
    }

    fn update(&self, conn: &Connection) -> Result<(), Error> {
        let sql =
            "UPDATE directories SET name=(?1), workspace_id=(?2), path=(?3), parent_id=(?4), updated_at = (?5) WHERE id = (?6)";

        conn.execute(
            sql,
            (
                &self.name,
                &self.workspace_id,
                &self.path,
                &self.parent_id,
                &self.updated_at,
                &self.id,
            ),
        )?;

        Ok(())
    }

    fn delete(id: i32, conn: &Connection) -> Result<(), Error> {
        let sql = "DELETE FROM directories WHERE id = (?1)";
        conn.execute(sql, (id,))?;

        Ok(())
    }
}

#[tauri::command]
pub fn create_dir(
    name: String,
    workspace_id: i32,
    path: String,
    parent_id: Option<i32>,
    database: State<Database>,
) -> Option<Directory> {
    let directory = Directory::new(name, workspace_id, path, parent_id, None);

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
    workspace_id: i32,
    parent_id: Option<i32>,
    database: State<Database>,
) -> Vec<Directory> {
    let directories = Directory::list(&database.get_connection(), workspace_id, parent_id)
        .expect("[Directories] Failed to fetch!");

    directories
}

#[tauri::command]
pub fn delete_dir(id: i32, database: State<Database>) -> bool {
    match Directory::delete(id, &database.get_connection()) {
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
    workspace_id: i32,
    path: String,
    parent_id: Option<i32>,
    database: State<Database>,
) -> Option<Directory> {
    let conn = &database.get_connection();
    let directory = match Directory::list(conn, workspace_id, parent_id) {
        Ok(w) => w.into_iter().find(|w| w.id == Some(id)),
        Err(e) => {
            eprintln!("[Directories] Failed to get for update! {}", e);
            None
        }
    };

    if let Some(mut dir) = directory {
        dir.name = name;
        dir.workspace_id = workspace_id;
        dir.path = path;
        dir.parent_id = parent_id;
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
