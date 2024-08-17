use chrono::Utc;
use rusqlite::{Connection, Error};
use tauri::State;

use crate::database::Database;

#[derive(serde::Serialize, serde::Deserialize)]
pub struct Workspace {
    id: Option<i32>,
    name: String,
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

        let sql = "INSERT INTO workspaces (name, selected, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)";

        conn.execute(
            sql,
            (
                &self.name,
                &(self.selected as i32),
                &self.created_at,
                &self.updated_at,
            ),
        )?;

        Ok(())
    }

    fn list(conn: &Connection) -> Result<Vec<Self>, Error> {
        let mut stmt =
            conn.prepare("SELECT id, name, selected, created_at, updated_at from workspaces")?;
        let workspace_iter = stmt.query_map([], |row| {
            let selected: i32 = row.get(2)?;

            Ok(Workspace {
                id: row.get(0)?,
                name: row.get(1)?,
                selected: selected != 0,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
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

        let sql = "UPDATE workspaces SET name = (?1), selected = (?2), updated_at = (?3) WHERE id = (?4)";

        conn.execute(
            sql,
            (&self.name, &(self.selected as i32), &self.updated_at, &self.id),
        )?;

        Ok(())
    }

    fn delete(id: String, conn: &Connection) -> Result<(), Error> {
        let sql = "DELETE FROM workspaces WHERE id = (?id)";
        conn.execute(sql, (id,))?;

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
pub fn list_workspaces(database: State<Database>) -> Vec<Workspace> {
    let workspaces =
        Workspace::list(&database.get_connection()).expect("[Workspaces] Failed to fetch!");

    workspaces
}

#[tauri::command]
pub fn delete_workspace(id: String, database: State<Database>) -> bool {
    match Workspace::delete(id, &database.get_connection()) {
        Ok(_) => true,
        Err(e) => {
            eprintln!("[Workspaces] Failed to delete! {}", e);
            false
        }
    }
}

#[tauri::command]
pub fn update_workspace(id: i32, name: String, selected: bool, database: State<Database>) -> Option<Workspace> {
    let conn = &database.get_connection();
    let workspace = match Workspace::list(conn){
        Ok(w) => w.into_iter().find(|w| {
            w.id == Some(id)
        }),
        Err(e) => {
            eprintln!("[Workspaces] Failed to get ! {}", e);
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
            },
            Err(e) => {
                eprintln!("[Workspaces] Failed to delete! {}", e);
                return None;
            }
        }
    }

    None
}
