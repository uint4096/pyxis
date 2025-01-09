use aws_sdk_dynamodb::{self as DynamoDB, types::AttributeValue};
use pwhash::bcrypt;
use serde::{Deserialize, Serialize};
use serde_with::serde_as;
use std::{collections::HashMap, error::Error, str::FromStr, sync::Arc};
use uuid::Uuid;

static TABLE_NAME: &str = "users";

#[serde_as]
#[derive(Serialize, Deserialize, PartialEq, Eq, Clone)]
pub struct UserWithPassword {
    pub user_id: String,
    pub username: String,
    pub device_ids: Vec<String>,
    pub password: String,
}

#[serde_as]
#[derive(Serialize, Deserialize, Clone)]
pub struct UserWithoutPassword {
    pub user_id: Uuid,
    pub username: String,
    pub device_id: Uuid,
}

impl From<&HashMap<String, AttributeValue>> for UserWithPassword {
    fn from(value: &HashMap<String, AttributeValue>) -> Self {
        UserWithPassword {
            user_id: value
                .get("user_id")
                .and_then(|v| v.as_s().ok())
                .cloned()
                .expect("user_id should exist"),
            username: value
                .get("username")
                .and_then(|v| v.as_s().ok())
                .cloned()
                .expect("username should exist"),
            password: value
                .get("password")
                .and_then(|v| v.as_s().ok())
                .cloned()
                .expect("password should exist"),
            device_ids: value
                .get("device_ids")
                .and_then(|v| v.as_l().ok())
                .map(|list| {
                    list.iter()
                        .filter_map(|e| e.as_s().ok())
                        .cloned()
                        .collect::<Vec<String>>()
                })
                .expect("device_ids should exist"),
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

    pub async fn create(
        &self,
        user: UserWithoutPassword,
        password: String,
    ) -> Result<UserWithoutPassword, Box<dyn Error>> {
        let hashed_pwd = pwhash::bcrypt::hash(password.clone())?;

        let user_id_av = AttributeValue::S(user.user_id.to_string());
        let device_id_av = AttributeValue::L(vec![AttributeValue::S(user.device_id.to_string())]);
        let username_av = AttributeValue::S(user.username.clone());
        let pwd_av = AttributeValue::S(hashed_pwd);

        self.client
            .put_item()
            .table_name(TABLE_NAME)
            .item("user_id", user_id_av)
            .item("device_ids", device_id_av)
            .item("username", username_av)
            .item("password", pwd_av)
            .send()
            .await?;

        Ok(user)
    }

    pub async fn update_devices(
        &self,
        user_id: String,
        device_ids: Vec<String>,
    ) -> Result<(), Box<dyn Error>> {
        let user_id_av = AttributeValue::S(user_id.to_string());
        let device_id_av = AttributeValue::L(
            device_ids
                .into_iter()
                .map(|d| AttributeValue::S(d.to_string()))
                .collect(),
        );

        self.client
            .update_item()
            .table_name(TABLE_NAME)
            .condition_expression("#user_id = :user_id")
            .update_expression("SET #device_ids = :device_ids")
            .expression_attribute_names("#device_ids", "device_ids")
            .expression_attribute_names("#user_id", "user_id")
            .expression_attribute_values(":device_ids", device_id_av)
            .expression_attribute_values(":user_id", user_id_av)
            .send()
            .await?;

        Ok(())
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

    pub async fn get(&self, username: &str) -> Result<Option<UserWithPassword>, Box<dyn Error>> {
        let user_iter = self
            .client
            .query()
            .table_name(TABLE_NAME)
            .index_name("username-gsi")
            .key_condition_expression("#username=:username")
            .expression_attribute_names("#username", "username")
            .expression_attribute_values(":username", AttributeValue::S(username.to_string()))
            .send()
            .await?;

        if let Some(users) = user_iter.items {
            let user_map: Vec<UserWithPassword> = users.iter().map(|v| v.into()).collect();
            if user_map.len() > 0 {
                return Ok(Some(user_map[0].clone()));
            }
        }

        Ok(None)
    }

    pub async fn get_devices(&self, username: &str) -> Result<Vec<String>, Box<dyn Error>> {
        let user_iter = self
            .client
            .query()
            .table_name(TABLE_NAME)
            .index_name("username-gsi")
            .key_condition_expression("#username=:username")
            .expression_attribute_names("#username", "username")
            .expression_attribute_values(":username", AttributeValue::S(username.to_string()))
            .send()
            .await?;

        if let Some(users) = user_iter.items {
            let users: Vec<UserWithPassword> = users.iter().map(|v| v.into()).collect();
            let devices: Vec<String> = users.into_iter().flat_map(|u| u.device_ids).collect();

            return Ok(devices);
        }

        Ok(Vec::new())
    }

    pub async fn verify(
        &self,
        username: String,
        password: String,
        device_id: String,
    ) -> Result<Option<UserWithoutPassword>, Box<dyn Error>> {
        println!("Fetching user {}", username);

        let user = self.get(&username).await?;

        if let Some(users) = user {
            let UserWithPassword {
                password: pwd_hash,
                user_id,
                device_ids,
                username,
            } = users;
            let verification = bcrypt::verify(password, &pwd_hash);

            let is_new_device = !device_ids.clone().into_iter().any(|e| e == device_id);
            let device_ids = if is_new_device {
                device_ids
                    .iter()
                    .chain(&[device_id.clone()])
                    .cloned()
                    .collect()
            } else {
                device_ids
            };

            if is_new_device {
                self.update_devices(user_id.clone(), device_ids.clone())
                    .await?;
            }

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
