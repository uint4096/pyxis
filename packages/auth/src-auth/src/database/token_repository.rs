use std::{env, error::Error};

use chrono::{Duration, Utc};
use jsonwebtoken::{encode, EncodingKey, Header};
use scylla::frame::value::CqlTimestamp;
use scylla::Session;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::user_repository::User;
use serde_with::{chrono::TimeDelta, serde_as, DurationSeconds};

#[derive(Serialize, Deserialize)]
pub struct Claims {
    user: User,
    exp: usize,
    iat: usize,
}

#[serde_as]
#[derive(Serialize, Deserialize)]
pub struct UserToken {
    user_id: Uuid,
    device_id: Uuid,
    token: String,
    #[serde_as(as = "DurationSeconds<i64>")]
    expiration_time: TimeDelta,
}

pub struct TokenRepository {
    session: Session,
}

impl TokenRepository {
    pub async fn create(&self, user: User) -> Result<UserToken, Box<dyn Error>> {
        let duration = Duration::hours(24 * 30);

        let exp = Utc::now()
            .checked_add_signed(Duration::hours(24 * 30))
            .expect("Valid timestamp")
            .timestamp() as usize;

        let claim = Claims {
            user,
            exp,
            iat: Utc::now().timestamp() as usize,
        };

        let token = encode(
            &Header::default(),
            &claim,
            &EncodingKey::from_secret(
                env::var("AUTH_SECRET")
                    .expect("No authentication secret specified!")
                    .as_ref(),
            ),
        )?;

        let user_token = UserToken {
            user_id: claim.user.user_id,
            device_id: claim.user.device_id,
            token: token.clone(),
            expiration_time: duration,
        };

        self.session.query_unpaged("INSERT INTO pyxis_db.user_tokens (user_id, device_id, token, expiration_time) VALUES (?, ?, ?, ?)", &(claim.user.user_id, claim.user.device_id, token, CqlTimestamp(duration.num_seconds()))).await?;

        Ok(user_token)
    }

    pub async fn delete(&self, user_id: &Uuid) -> Result<(), Box<dyn Error>> {
        self.session
            .query_unpaged(
                "DELETE FROM pyxis_db.user_tokens WHERE user_id = ?",
                &(user_id,),
            )
            .await?;

        Ok(())
    }
}
