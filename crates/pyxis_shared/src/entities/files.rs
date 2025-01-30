use chrono::Utc;
use nanoid::nanoid;
use rusqlite::{Connection, Error, Result, Row};
use serde_json::{from_str, to_string};

#[derive(serde::Serialize, serde::Deserialize)]
pub struct Link {
    title: String,
    url: String,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct Files {
    pub id: Option<i32>,
    pub uid: String,
    pub dir_uid: Option<String>,
    pub title: String,
    pub path: String,
    pub created_at: String,
    pub updated_at: String,
    pub tags: Vec<String>,
    pub workspace_uid: String,
    pub links: Vec<Link>,
    pub synced: Option<bool>,
}

pub fn val_or_else<'a, T>(val: &'a Option<T>, value: &'a str, else_value: &'a str) -> &'a str {
    if let Some(_) = val {
        value
    } else {
        else_value
    }
}

impl Files {
    pub fn new(
        dir_uid: Option<String>,
        path: String,
        title: String,
        tags: Vec<String>,
        links: Vec<Link>,
        workspace_uid: String,
        id: Option<i32>,
        created_at: Option<String>,
        updated_at: Option<String>,
        uid: Option<String>,
        synced: Option<bool>,
    ) -> Self {
        let current_time = Utc::now().to_rfc3339();

        Self {
            id,
            uid: uid.or(Some(nanoid!(10))).unwrap(),
            dir_uid,
            workspace_uid,
            path,
            title,
            created_at: created_at.or(Some(String::from(&current_time))).unwrap(),
            updated_at: updated_at.or(Some(String::from(&current_time))).unwrap(),
            links,
            tags,
            synced,
        }
    }

    pub fn get(conn: &Connection, id: i64) -> Result<Files, Error> {
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
                f.tags, \
                d.uid as dir_uid, \
                f.synced \
                FROM files f \
                INNER JOIN workspaces w ON f.workspace_id = w.id \
                LEFT JOIN directories d ON f.dir_id = d.id \
                WHERE f.id = ?1"
        ))?;

        stmt.query_row(&[&id], |row| -> Result<Files, Error> {
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
                dir_uid: row.get(9)?,
                links,
                tags,
                synced: row.get(10)?,
            })
        })
    }

    pub fn create(&self, conn: &Connection) -> Result<(), Error> {
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

        let sql = "INSERT INTO files (uid, dir_id, workspace_id, path, title, created_at, updated_at, links, tags, synced) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)";

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
                &self.synced,
            ),
        )?;

        Ok(())
    }

    pub fn list(
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
                f.tags, \
                f.synced \
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
                    Some(row.get(10)?)
                } else {
                    None
                },
                synced: row.get(9)?,
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

    pub fn update(&self, conn: &Connection) -> Result<(), Error> {
        let dir_id: Option<i32> = if let Some(_) = self.dir_uid {
            let mut dir_sql = conn.prepare("SELECT id FROM directories WHERE uid = ?1")?;

            Some(dir_sql.query_row(&[&self.dir_uid], |row| -> Result<i32> { Ok(row.get(0)?) })?)
        } else {
            None
        };

        let sql =
            "UPDATE files SET dir_id=(?1), title=(?2), path=(?3), links=(?4), tags=(?5), updated_at=(?6), synced=(?7) WHERE uid = (?8)";

        conn.execute(
            sql,
            (
                &dir_id,
                &self.title,
                &self.path,
                &to_string(&self.links).expect("[Files] Unable to serialize links"),
                &to_string(&self.tags).expect("[Files] Unable to serialize tags"),
                &self.updated_at,
                &self.synced,
                &self.uid,
            ),
        )?;

        Ok(())
    }

    pub fn get_by_path(
        conn: &Connection,
        path: String,
        workspace_uid: String,
    ) -> Result<i64, Error> {
        let mut stmt = conn.prepare(&format!(
            "SELECT \
                f.id, \
                FROM files f \
                INNER JOIN workspaces w ON f.workspace_id = w.id \
                WHERE f.path = ?1 \
                AND w.uid = ?2"
        ))?;

        stmt.query_row(&[&path, &workspace_uid], |row| -> Result<i64, Error> {
            Ok(row.get(0)?)
        })
    }

    pub fn delete(uid: String, conn: &Connection) -> Result<(), Error> {
        let sql = "DELETE FROM files WHERE uid = (?1)";
        conn.execute(sql, (uid,))?;

        Ok(())
    }
}
