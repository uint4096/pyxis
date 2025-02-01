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
    pub synced: Option<bool>,
}

impl Directory {
    pub fn new(
        name: String,
        workspace_uid: String,
        path: String,
        parent_uid: Option<String>,
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
            workspace_uid,
            name,
            path,
            parent_uid,
            created_at: created_at.or(Some(String::from(&current_time))).unwrap(),
            updated_at: updated_at.or(Some(String::from(&current_time))).unwrap(),
            synced,
        }
    }

    pub fn get(conn: &Connection, id: i64) -> Result<Directory, Error> {
        let mut sql = conn.prepare(
            "SELECT \
                d.id, \
                d.uid, \
                d.name, \
                w.uid as workspace_uid, \
                d.path, \
                d.parent_uid, \
                d.created_at, \
                d.updated_at, \
                d.synced \
                FROM directories d \
                INNER JOIN workspaces w ON d.workspace_id = w.id \
                WHERE d.id = ?1",
        )?;

        sql.query_row(&[&id], |row| -> Result<Directory, Error> {
            Ok(Directory {
                id: row.get(0)?,
                uid: row.get(1)?,
                name: row.get(2)?,
                workspace_uid: row.get(3)?,
                path: row.get(4)?,
                parent_uid: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
                synced: row.get(8)?,
            })
        })
    }

    pub fn create(&self, conn: &Connection) -> Result<(), Error> {
        let workspace_id: i32 = {
            let mut workspace_sql = conn.prepare("SELECT id FROM workspaces WHERE uid = ?1")?;
            workspace_sql.query_row(&[&self.workspace_uid], |row| -> Result<i32> {
                Ok(row.get(0)?)
            })?
        };

        let sql = "INSERT INTO directories (name, uid, workspace_id, path, parent_uid, created_at, updated_at, synced) \
                         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)";

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
                &self.synced,
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
                    d.updated_at, \
                    d.synced \
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
                    d.updated_at, \
                    d.synced \
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
                synced: row.get(8)?,
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
            "UPDATE directories SET name=(?1), workspace_id=(?2), path=(?3), parent_uid=(?4), updated_at=(?5), synced=(?6) \
             WHERE uid = (?7)";

        conn.execute(
            sql,
            (
                &self.name,
                &workspace_id,
                &self.path,
                &self.parent_uid,
                &self.updated_at,
                &self.synced,
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

    pub fn get_by_path(
        conn: &Connection,
        path: String,
        workspace_uid: String,
    ) -> Result<i64, Error> {
        let mut stmt = conn.prepare(&format!(
            "SELECT \
                d.id \
                FROM directories d \
                INNER JOIN workspaces w ON d.workspace_id = w.id \
                WHERE d.path = ?1 \
                AND w.uid = ?2"
        ))?;

        stmt.query_row(&[&path, &workspace_uid], |row| -> Result<i64, Error> {
            Ok(row.get(0)?)
        })
    }
}
