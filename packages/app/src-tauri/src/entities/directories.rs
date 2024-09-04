use chrono::Utc;
use nanoid::nanoid;
use rusqlite::{Connection, Error, Result, Row};
use tauri::State;

use crate::database::Database;

#[derive(serde::Serialize, serde::Deserialize)]
pub struct Directory {
    id: Option<i32>,
    uid: String,
    name: String,
    workspace_uid: String,
    created_at: String,
    updated_at: String,
    path: String,
    parent_uid: Option<String>,
}

impl Directory {
    fn new(
        name: String,
        workspace_uid: String,
        path: String,
        parent_uid: Option<String>,
        id: Option<i32>,
    ) -> Self {
        let current_time = Utc::now().to_rfc3339();

        Self {
            id,
            uid: nanoid!(10),
            workspace_uid,
            name,
            path,
            parent_uid,
            created_at: String::from(&current_time),
            updated_at: String::from(&current_time),
        }
    }

    fn create(&self, conn: &Connection) -> Result<(), Error> {
        let workspace_id: i32 = {
            let mut workspace_sql = conn.prepare("SELECT id FROM workspaces WHERE uid = ?1")?;
            workspace_sql.query_row(&[&self.workspace_uid], |row| -> Result<i32> {
                Ok(row.get(0)?)
            })?
        };

        let sql = "INSERT INTO directories (name, uid, workspace_id, path, parent_uid, created_at, updated_at) \
                         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)";

        conn.execute(
            sql,
            (
                &self.name,
                &self.uid,
                &workspace_id,
                &self.path,
                &self.parent_uid,
                &self.created_at,
                &self.updated_at,
            ),
        )?;

        Ok(())
    }

    fn list(
        conn: &Connection,
        workspace_uid: String,
        parent_uid: Option<String>,
    ) -> Result<Vec<Self>, Error> {
        let mut stmt = match parent_uid {
            Some(_) => conn.prepare(
                "SELECT \
                    d.id, \
                    d.uid, \
                    d.name, \
                    w.uid as workspace_uid, \
                    d.path, \
                    d.parent_uid, \
                    d.created_at, \
                    d.updated_at \
                    FROM directories d \
                    INNER JOIN workspaces w ON d.workspace_id = w.id \
                    WHERE w.uid = ?1 \
                    AND d.parent_uid = ?2",
            )?,
            None => conn.prepare(
                "SELECT \
                    d.id, \
                    d.uid, \
                    d.name, \
                    w.uid as workspace_uid, \
                    d.path, \
                    d.parent_uid, \
                    d.created_at, \
                    d.updated_at \
                    FROM directories d \
                    INNER JOIN workspaces w ON d.workspace_id = w.id \
                    WHERE w.uid = ?1 \
                    AND d.parent_uid IS NULL",
            )?,
        };

        let handler = |row: &Row| -> Result<Directory> {
            Ok(Directory {
                id: row.get(0)?,
                uid: row.get(1)?,
                name: row.get(2)?,
                workspace_uid: row.get(3)?,
                path: row.get(4)?,
                parent_uid: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        };

        let dir_iter = match parent_uid {
            Some(p_id) => stmt.query_map(&[&workspace_uid, &p_id], handler)?,
            None => stmt.query_map(&[&workspace_uid], handler)?,
        };

        let directories: Vec<Directory> = dir_iter
            .map(|result| result.expect("[Directories] Error while mapping rows"))
            .collect();

        Ok(directories)
    }

    fn update(&self, conn: &Connection) -> Result<(), Error> {
        let mut workspace_sql = conn.prepare("SELECT id FROM workspaces WHERE uid = ?1")?;

        let workspace_id: i32 = workspace_sql
            .query_row(&[&self.workspace_uid], |row| -> Result<i32> {
                Ok(row.get(0)?)
            })?;

        let sql =
            "UPDATE directories SET name=(?1), workspace_id=(?2), path=(?3), parent_uid=(?4), updated_at = (?5) \
             WHERE uid = (?6)";

        conn.execute(
            sql,
            (
                &self.name,
                &workspace_id,
                &self.path,
                &self.parent_uid,
                &self.updated_at,
                &self.uid,
            ),
        )?;

        Ok(())
    }

    fn delete(uid: String, conn: &Connection) -> Result<(), Error> {
        let sql = "DELETE FROM directories WHERE uid = (?1)";
        conn.execute(sql, (uid,))?;

        Ok(())
    }
}

#[tauri::command]
pub fn create_dir(
    name: String,
    workspace_uid: String,
    path: String,
    parent_uid: Option<String>,
    database: State<Database>,
) -> Option<Directory> {
    let directory = Directory::new(name, workspace_uid, path, parent_uid, None);

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
