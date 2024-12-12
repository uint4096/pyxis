use pwhash::bcrypt;
use aws_sdk_dynamodb::{self as DynamoDB, types::AttributeValue};
use serde::{Deserialize, Serialize};
use serde_with::serde_as;
use std::{collections::HashMap, error::Error, str::FromStr, sync::Arc};
use uuid::Uuid;

static TABLE_NAME: &str = "users";

#[serde_as]
#[derive(Serialize, Deserialize, PartialEq, Eq)]
pub struct UserWithPassword {
    pub user_id: String,
    pub username: String,
    pub device_id: String,
    pub password: String
}

#[serde_as]
#[derive(Serialize, Deserialize)]
pub struct UserWithoutPassword {
    pub user_id: Uuid,
    pub username: String,
    pub device_id: Uuid,
}

impl From<&HashMap<String, AttributeValue>> for UserWithPassword {
    fn from(value: &HashMap<String, AttributeValue>) -> Self {
        UserWithPassword {
            user_id: value.get("user_id")
                .and_then(|v| v.as_s().ok())
                .cloned()
                .expect("user_id should exist"),
            username: value.get("username")
                .and_then(|v| v.as_s().ok())
                .cloned()
                .expect("username should exist"),
            password: value.get("password")
                .and_then(|v| v.as_s().ok())
                .cloned()
                .expect("password should exist"),
            device_id: value.get("device_id")
                .and_then(|v| v.as_s().ok())
                .cloned()
                .expect("device_id should exist"),
        }

    }
}

pub struct UserRepository {
    client: Arc<DynamoDB::Client>,
}

impl UserRepository {
    pub fn new(client: Arc<DynamoDB::Client>) -> Self {
        Self { client }
    }

    pub async fn create(&self, user: UserWithoutPassword, password: String) -> Result<UserWithoutPassword, Box<dyn Error>> {
        let hashed_pwd = pwhash::bcrypt::hash(password.clone())?;

        let user_id_av = AttributeValue::S(user.user_id.to_string());
        let device_id_av = AttributeValue::S(user.device_id.to_string());
        let username_av = AttributeValue::S(user.username.clone());
        let pwd_av = AttributeValue::S(hashed_pwd);

        self.client
            .put_item()
            .table_name(TABLE_NAME)
            .item("user_id", user_id_av)
            .item("device_id", device_id_av)
            .item("username", username_av)
            .item("password", pwd_av)
            .send()
            .await?;

        Ok(user)
    }

    pub async fn delete(&self, user_id: &Uuid) -> Result<(), Box<dyn Error>> {
        self.client
            .delete_item()
            .table_name(TABLE_NAME)
            .key("user_id", AttributeValue::S(user_id.to_string()))
            .send()
            .await?;

        Ok(())
    }

    pub async fn verify(
        &self,
        username: String,
        password: String,
    ) -> Result<Option<UserWithoutPassword>, Box<dyn Error>> {
        println!("Fetching user {}", username);

        let user_iter = self
            .client
            .query()
            .table_name(TABLE_NAME)
            .index_name("username-index")
            .key_condition_expression("#username=:username")
            .expression_attribute_names("#username", "username")
            .expression_attribute_values(":username", AttributeValue::S(username))
            .send()
            .await?;

        println!("Fetched user {:?}", user_iter);

        if let Some(users) = user_iter.items {
            let user_map: Vec<UserWithPassword> = users.iter().map(|v| v.into()).collect();
            let UserWithPassword { password: pwd_hash, user_id, device_id, username } = &user_map[0];
            let verification = bcrypt::verify(password, &pwd_hash);

            if verification {
                return Ok(Some(UserWithoutPassword {
                    user_id: Uuid::from_str(&user_id)?,
                    username: username.clone(),
                    device_id: Uuid::from_str(&device_id)?,
                }));
            }
        }

        Ok(None)
    }
}
