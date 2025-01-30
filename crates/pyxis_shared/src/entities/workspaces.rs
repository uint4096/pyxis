use chrono::Utc;
use nanoid::nanoid;
use rusqlite::{Connection, Error};

#[derive(serde::Serialize, serde::Deserialize)]
pub struct Workspace {
    pub id: Option<i32>,
    pub name: String,
    pub uid: String,
    pub selected: bool,
    pub created_at: String,
    pub updated_at: String,
    pub synced: Option<bool>,
}

impl Workspace {
    pub fn new(
        name: String,
        selected: bool,
        id: Option<i32>,
        created_at: Option<String>,
        updated_at: Option<String>,
        uid: Option<String>,
        synced: Option<bool>,
    ) -> Self {
        let current_time = Utc::now().to_rfc3339();

        Self {
            id,
            selected,
            uid: uid.or(Some(nanoid!(10))).unwrap(),
            name,
            created_at: created_at.or(Some(String::from(&current_time))).unwrap(),
            updated_at: updated_at.or(Some(String::from(&current_time))).unwrap(),
            synced,
        }
    }

    pub fn get(connection: &Connection, id: i64) -> Result<Workspace, Error> {
        let mut sql = connection.prepare(
            "SELECT id, uid, name, selected, created_at, updated_at, synced from workspaces WHERE id=?1",
        )?;

        sql.query_row(&[&id], |row| -> Result<Workspace, Error> {
            Ok(Workspace {
                id: row.get(0)?,
                uid: row.get(1)?,
                name: row.get(2)?,
                selected: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
                synced: row.get(6)?,
            })
        })
    }

    pub fn create(&self, conn: &Connection) -> Result<(), Error> {
        if self.selected {
            let update_sql = "UPDATE workspaces SET selected = 0 WHERE selected = 1";
            conn.execute(&update_sql, ())?;
        }

        let sql = "INSERT INTO workspaces (name, uid, selected, created_at, updated_at, synced) VALUES (?1, ?2, ?3, ?4, ?5, ?6)";

        conn.execute(
            sql,
            (
                &self.name,
                &self.uid,
                &(self.selected as i32),
                &self.created_at,
                &self.updated_at,
                &self.synced,
            ),
        )?;

        Ok(())
    }

    pub fn list(conn: &Connection) -> Result<Vec<Self>, Error> {
        let mut stmt = conn.prepare(
            "SELECT id, uid, name, selected, created_at, updated_at, synced from workspaces",
        )?;
        let workspace_iter = stmt.query_map([], |row| {
            let selected: i32 = row.get(3)?;

            Ok(Workspace {
                id: row.get(0)?,
                uid: row.get(1)?,
                name: row.get(2)?,
                selected: selected != 0,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
                synced: row.get(6)?,
            })
        })?;

        let workspaces: Vec<Workspace> = workspace_iter
            .map(|result| result.expect("[Workspaces] Error while mapping rows"))
            .collect();

        Ok(workspaces)
    }

    pub fn update(&self, conn: &Connection) -> Result<(), Error> {
        if self.selected {
            let update_sql = "UPDATE workspaces SET selected = 0 WHERE selected = 1";
            conn.execute(&update_sql, ())?;
        }

        let sql =
            "UPDATE workspaces SET name = (?1), selected = (?2), updated_at = (?3), synced = (?4) WHERE uid = (?5)";

        conn.execute(
            sql,
            (
                &self.name,
                &(self.selected as i32),
                &self.updated_at,
                &self.synced,
                &self.uid,
            ),
        )?;

        Ok(())
    }

    pub fn delete(uid: String, conn: &Connection) -> Result<(), Error> {
        let sql = "DELETE FROM workspaces WHERE uid = ?1";
        conn.execute(sql, (uid,))?;

        Ok(())
    }

    pub fn get_by_name(conn: &Connection, name: String) -> Result<i64, Error> {
        let mut stmt = conn.prepare(&format!(
            "SELECT \
                id \
                FROM workspaces \
                WHERE w.name = ?1"
        ))?;

        stmt.query_row(&[&name], |row| -> Result<i64, Error> { Ok(row.get(0)?) })
    }
}
