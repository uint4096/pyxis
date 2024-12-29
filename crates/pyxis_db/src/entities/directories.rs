use chrono::Utc;
use nanoid::nanoid;
use rusqlite::{Connection, Error, Result, Row};

#[derive(serde::Serialize, serde::Deserialize)]
pub struct Directory {
    pub id: Option<i32>,
    pub uid: String,
    pub name: String,
    pub workspace_uid: String,
    pub created_at: String,
    pub updated_at: String,
    pub path: String,
    pub parent_uid: Option<String>,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct DirectoryRaw {
    pub id: Option<i32>,
    pub uid: String,
    pub name: String,
    pub workspace_id: i32,
    pub created_at: String,
    pub updated_at: String,
    pub path: String,
    pub parent_uid: Option<String>,
}

impl Directory {
    pub fn new(
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

    pub fn create(&self, conn: &Connection) -> Result<(), Error> {
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

    pub fn list(
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

    pub fn update(&self, conn: &Connection) -> Result<(), Error> {
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

    pub fn delete(uid: String, conn: &Connection) -> Result<(), Error> {
        let sql = "DELETE FROM directories WHERE uid = (?1)";
        conn.execute(sql, (uid,))?;

        Ok(())
    }
}
