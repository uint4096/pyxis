use pwhash::bcrypt;
use scylla::Session;
use serde::{Deserialize, Serialize};
use serde_with::serde_as;
use std::{error::Error, sync::Arc};
use uuid::Uuid;

#[serde_as]
#[derive(Serialize, Deserialize)]
pub struct User {
    pub user_id: Uuid,
    pub username: String,
    pub device_id: Uuid,
}

pub struct UserRepository {
    session: Arc<Session>,
}

impl UserRepository {
    pub fn new(session: Arc<Session>) -> Self {
        Self { session }
    }

    pub async fn create(&self, user: User, password: String) -> Result<User, Box<dyn Error>> {
        let hashed_pwd = pwhash::bcrypt::hash(password.clone())?;

        self.session.query_unpaged("INSERT INTO pyxis_db.users (user_id, username, device_id, password) VALUES (?, ?, ?, ?)", &(user.user_id, user.username.clone(), user.device_id, hashed_pwd)).await?;

        Ok(user)
    }

    pub async fn delete(&self, user_id: &Uuid) -> Result<(), Box<dyn Error>> {
        self.session
            .query_unpaged("DELETE FROM pyxis_db.users WHERE user_id = ?", &(user_id,))
            .await?;

        Ok(())
    }

    pub async fn verify(
        &self,
        username: String,
        password: String,
    ) -> Result<Option<User>, Box<dyn Error>> {
        let user_iter = self
            .session
            .query_unpaged(
                "SELECT * from pyxis_db.users WHERE username = ?",
                &(username,),
            )
            .await?
            .into_rows_result()?;

        let user = user_iter.maybe_first_row::<(Uuid, String, Uuid, String)>()?;

        if let Some(user) = user {
            let (user_id, username, device_id, pwd_hash) = user;
            let verification = bcrypt::verify(password, &pwd_hash);

            if verification {
                return Ok(Some(User {
                    user_id,
                    username,
                    device_id,
                }));
            }
        }

        Ok(None)
    }
}
