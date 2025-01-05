use rusqlite::{params_from_iter, Connection, Error};
use serde::{Deserialize, Serialize};
use serde_with::serde_as;

#[serde_as]
#[derive(Serialize, Deserialize, Debug)]
pub struct Device {
    pub id: Option<i64>,
    pub device_ids: Vec<String>
}

impl Device {
    pub fn new(id: Option<i64>, device_ids: Vec<String>) -> Self {
        Self {
            id,
            device_ids,
        }
    }

    pub fn list(conn: &Connection) -> Result<Vec<String>, Error> {
        let mut stmt = conn.prepare("SELECT device_id FROM devices")?;

        let device_iter = stmt.query_map([], |row| -> Result<String, Error> { Ok(row.get(0)?) })?;
        let devices: Vec<String> = device_iter
        .map(|result| result.expect("[Devices] Error while mapping rows"))
        .collect();

        Ok(devices)
    }

    pub fn add(&self, conn: &Connection) -> Result<(), Error> {
        let placeholders: Vec<String> = (0..self.device_ids.len()).map(|i| format!("(?{})", i + 1)).collect();
        let placeholders = placeholders.join(",");

        let insert_query = format!("INSERT INTO devices (device_id) VALUES {} ON CONFLICT (device_id) DO NOTHING;", placeholders);

        conn.execute(
            &insert_query,
            params_from_iter(self.device_ids.clone()),
        )?;

        Ok(())
    }
}
