use chrono::Utc;
use nanoid::nanoid;
use rusqlite::{Connection, Error};
use tauri::State;

use crate::database::Database;

#[derive(serde::Serialize, serde::Deserialize)]
pub struct Workspace {
    id: Option<i32>,
    name: String,
    uid: String,
    selected: bool,
    created_at: String,
    updated_at: String,
}

impl Workspace {
    fn new(name: String, selected: bool, id: Option<i32>) -> Self {
        let current_time = Utc::now().to_rfc3339();

        Self {
            id,
            selected,
            uid: nanoid!(10),
            name,
            created_at: String::from(&current_time),
            updated_at: String::from(&current_time),
        }
    }

    fn create(&self, conn: &Connection) -> Result<(), Error> {
        if self.selected {
            let update_sql = "UPDATE workspaces SET selected = 0 WHERE selected = 1";
            conn.execute(&update_sql, ())?;
        }

        let sql = "INSERT INTO workspaces (name, uid, selected, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)";

        conn.execute(
            sql,
            (
                &self.name,
                &self.uid,
                &(self.selected as i32),
                &self.created_at,
                &self.updated_at,
            ),
        )?;

        Ok(())
    }

    fn list(conn: &Connection) -> Result<Vec<Self>, Error> {
        let mut stmt =
            conn.prepare("SELECT id, uid, name, selected, created_at, updated_at from workspaces")?;
        let workspace_iter = stmt.query_map([], |row| {
            let selected: i32 = row.get(3)?;

            Ok(Workspace {
                id: row.get(0)?,
                uid: row.get(1)?,
                name: row.get(2)?,
                selected: selected != 0,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })?;

        let workspaces: Vec<Workspace> = workspace_iter
            .map(|result| result.expect("[Workspaces] Error while mapping rows"))
            .collect();

        Ok(workspaces)
    }

    fn update(&self, conn: &Connection) -> Result<(), Error> {
        if self.selected {
            let update_sql = "UPDATE workspaces SET selected = 0 WHERE selected = 1";
            conn.execute(&update_sql, ())?;
        }

        let sql =
            "UPDATE workspaces SET name = (?1), selected = (?2), updated_at = (?3) WHERE uid = (?4)";

        conn.execute(
            sql,
            (
                &self.name,
                &(self.selected as i32),
                &self.updated_at,
                &self.uid,
            ),
        )?;

        Ok(())
    }

    fn delete(uid: String, conn: &Connection) -> Result<(), Error> {
        let sql = "DELETE FROM workspaces WHERE uid = (?id)";
        conn.execute(sql, (uid,))?;

        Ok(())
    }
}

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
