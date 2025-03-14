use std::{env, error::Error, sync::Arc};

use aws_sdk_dynamodb::{self as DynamoDB, types::AttributeValue};
use chrono::{Duration, Utc};
use jsonwebtoken::{encode, EncodingKey, Header};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::user_repository::UserWithoutPassword;
use serde_with::{chrono::TimeDelta, serde_as, DurationSeconds};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Claims {
    pub user: UserWithoutPassword,
    pub exp: usize,
    pub iat: usize,
}

#[serde_as]
#[derive(Serialize, Deserialize)]
pub struct UserToken {
    user_id: Uuid,
    device_id: Uuid,
    user_token: String,
    #[serde_as(as = "DurationSeconds<i64>")]
    expiration_time: TimeDelta,
}

pub struct TokenRepository {
    client: Arc<DynamoDB::Client>,
}

impl TokenRepository {
    pub fn new(client: Arc<DynamoDB::Client>) -> Self {
        Self { client }
    }

    fn get_table_name() -> String {
        env::var("TOKENS_TABLE").unwrap()
    }

    pub async fn create(&self, user: UserWithoutPassword) -> Result<UserToken, Box<dyn Error>> {
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
            &Header::new(jsonwebtoken::Algorithm::HS256),
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
            user_token: token.clone(),
            expiration_time: duration,
        };

        let user_id_av = AttributeValue::S(claim.user.user_id.to_string());
        let device_id_av = AttributeValue::S(claim.user.device_id.to_string());
        let token_av = AttributeValue::S(token);
        let expiration_av = AttributeValue::N(duration.num_milliseconds().to_string());

        self.client
            .put_item()
            .table_name(TokenRepository::get_table_name())
            .item("user_id", user_id_av)
            .item("device_id", device_id_av)
            .item("user_token", token_av)
            .item("expiration_time", expiration_av)
            .send()
            .await?;

        Ok(user_token)
    }

    pub async fn delete(&self, user_id: &Uuid, device_id: &Uuid) -> Result<(), Box<dyn Error>> {
        self.client
            .delete_item()
            .table_name(TokenRepository::get_table_name())
            .key("user_id", AttributeValue::S(user_id.to_string()))
            .key("device_id", AttributeValue::S(device_id.to_string()))
            .send()
            .await?;

        Ok(())
    }
}
