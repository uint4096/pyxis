use chrono::Utc;
use nanoid::nanoid;
use rusqlite::{Connection, Error, Result, Row};
use serde_json::{from_str, to_string};
use tauri::State;

use crate::database::Database;

#[derive(serde::Serialize, serde::Deserialize)]
pub struct Link {
    title: String,
    url: String,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct Files {
    id: Option<i32>,
    uid: String,
    dir_uid: Option<String>,
    title: String,
    path: String,
    created_at: String,
    updated_at: String,
    tags: Vec<String>,
    workspace_uid: String,
    links: Vec<Link>,
}

fn val_or_else<'a, T>(val: &'a Option<T>, value: &'a str, else_value: &'a str) -> &'a str {
    if let Some(_) = val {
        value
    } else {
        else_value
    }
}

impl Files {
    fn new(
        dir_uid: Option<String>,
        path: String,
        title: String,
        tags: Vec<String>,
        links: Vec<Link>,
        workspace_uid: String,
        id: Option<i32>,
    ) -> Self {
        let current_time = Utc::now().to_rfc3339();

        Self {
            id,
            uid: nanoid!(10),
            dir_uid,
            workspace_uid,
            path,
            title,
            created_at: String::from(&current_time),
            updated_at: String::from(&current_time),
            links,
            tags,
        }
    }

    fn create(&self, conn: &Connection) -> Result<(), Error> {
        let dir_id: Option<i32> = if let Some(_) = self.dir_uid {
            let mut stmt = conn.prepare("SELECT id FROM directories WHERE uid = ?1")?;
            Some(stmt.query_row(&[&self.dir_uid], |row| -> Result<i32> { Ok(row.get(0)?) })?)
        } else {
            None
        };

        let workspace_id: i32 = {
            let mut stmt = conn.prepare("SELECT id FROM workspaces WHERE uid = ?1")?;
            stmt.query_row(&[&self.workspace_uid], |row| -> Result<i32> {
                Ok(row.get(0)?)
            })?
        };

        let sql = "INSERT INTO files (uid, dir_id, workspace_id, path, title, created_at, updated_at, links, tags) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)";

        conn.execute(
            sql,
            (
                &self.uid,
                &dir_id,
                &workspace_id,
                &self.path,
                &self.title,
                &self.created_at,
                &self.updated_at,
                &to_string(&self.tags).expect("[Files] Unable to convert tags to JSON"),
                &to_string(&self.links).expect("[Files] Unable to convert links to JSON"),
            ),
        )?;

        Ok(())
    }

    fn list(
        conn: &Connection,
        workspace_uid: String,
        dir_uid: Option<String>,
    ) -> Result<Vec<Self>, Error> {
        let mut stmt = conn.prepare(&format!(
            "SELECT \
                f.id, \
                f.uid, \
                w.uid as workspace_uid, \
                f.path, \
                f.title, \
                f.created_at, \
                f.updated_at, \
                f.links, \
                f.tags \
                {} \
                FROM files f \
                INNER JOIN workspaces w ON f.workspace_id = w.id \
                {} \
                WHERE w.uid = ?1 \
                {}",
            { val_or_else(&dir_uid, ",d.uid as dir_uid", "") },
            { val_or_else(&dir_uid, "INNER JOIN directories d ON f.dir_id = d.id", "") },
            { val_or_else(&dir_uid, "AND d.uid = ?2", "AND f.dir_id IS NULL") }
        ))?;

        let handler = |row: &Row| -> Result<Files> {
            let links: String = row.get(7)?;
            let links: Vec<Link> = from_str(&links).expect("[Files] Unable to get links");

            let tags: String = row.get(8)?;
            let tags: Vec<String> = from_str(&tags).expect("[Files] Unable to get tags");

            Ok(Files {
                id: row.get(0)?,
                uid: row.get(1)?,
                workspace_uid: row.get(2)?,
                path: row.get(3)?,
                title: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
                links,
                tags,
                dir_uid: if let Some(_) = &dir_uid {
                    Some(row.get(9)?)
                } else {
                    None
                },
            })
        };

        let files_iter = match &dir_uid {
            Some(dir_id) => stmt.query_map(&[&workspace_uid, &dir_id], handler)?,
            None => stmt.query_map(&[&workspace_uid], handler)?,
        };

        let files: Vec<Files> = files_iter
            .map(|result| result.expect("[Files] Error while mapping rows"))
            .collect();

        Ok(files)
    }

    fn update(&self, conn: &Connection) -> Result<(), Error> {
        let dir_id: Option<i32> = if let Some(_) = self.dir_uid {
            let mut dir_sql = conn.prepare("SELECT id FROM directories WHERE uid = ?1")?;

            Some(dir_sql.query_row(&[&self.dir_uid], |row| -> Result<i32> { Ok(row.get(0)?) })?)
        } else {
            None
        };

        let sql =
            "UPDATE files SET dir_id=(?1), title=(?2), path=(?3), links=(?4), tags=(?5), updated_at=(?6) WHERE uid = (?7)";

        conn.execute(
            sql,
            (
                &dir_id,
                &self.title,
                &self.path,
                &to_string(&self.links).expect("[Files] Unable to serialize links"),
                &to_string(&self.tags).expect("[Files] Unable to serialize tags"),
                &self.updated_at,
            ),
        )?;

        Ok(())
    }

    fn delete(uid: String, conn: &Connection) -> Result<(), Error> {
        let sql = "DELETE FROM files WHERE uid = (?1)";
        conn.execute(sql, (uid,))?;

        Ok(())
    }
}

#[tauri::command]
pub fn create_file(
    title: String,
    dir_uid: Option<String>,
    path: String,
    workspace_uid: String,
    links: Vec<Link>,
    tags: Vec<String>,
    database: State<Database>,
) -> Option<Files> {
    let file = Files::new(dir_uid, path, title, tags, links, workspace_uid, None);

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
