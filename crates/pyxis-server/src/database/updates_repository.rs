use std::{collections::HashMap, error::Error, sync::Arc};

use aws_sdk_dynamodb::{self as DynamoDB, types::AttributeValue};
use chrono::Utc;
use serde::{Deserialize, Serialize};

static TABLE_NAME: &str = "updates_sync";

#[derive(Serialize, Deserialize)]
pub struct Update {
    pub pk: String, // user_id/device_id
    pub sk: String, // snapshot_id/file_id
    pub payload: String,
}

impl From<&HashMap<String, AttributeValue>> for Update {
    fn from(value: &HashMap<String, AttributeValue>) -> Self {
        Update {
            pk: value
                .get("pk")
                .and_then(|v| v.as_s().ok())
                .cloned()
                .expect("pk should exist"),
            sk: value
                .get("sk")
                .and_then(|v| v.as_s().ok())
                .cloned()
                .expect("sk should exist"),
            payload: value
                .get("payload")
                .and_then(|v| v.as_s().ok())
                .cloned()
                .expect("payload should exist"),
        }
    }
}

pub struct UpdateRepository {
    client: Arc<DynamoDB::Client>,
}

impl UpdateRepository {
    pub fn new(client: Arc<DynamoDB::Client>) -> Self {
        Self { client }
    }

    pub async fn create(&self, document: Update) -> Result<(), Box<dyn Error>> {
        let timestamp = Utc::now().timestamp();
        let Update { pk, sk, payload } = document;

        let pk_av = AttributeValue::S(pk);
        let sk_av = AttributeValue::S(sk);
        let payload_av = AttributeValue::S(payload);
        let timestamp_av = AttributeValue::N(timestamp.to_string());

        self.client
            .put_item()
            .table_name(TABLE_NAME)
            .item("pk", pk_av)
            .item("sk", sk_av)
            .item("payload", payload_av)
            .item("timestamp", timestamp_av)
            .send()
            .await?;

        Ok(())
    }

    pub async fn get_by_snapshot_id(
        &self,
        user_id: String,
        device_id: String,
        file_id: i64,
        snapshot_id: i64,
    ) -> Result<Vec<Update>, Box<dyn Error>> {
        let table_name = "updates";

        let records_iter = self
            .client
            .query()
            .table_name(table_name)
            .key_condition_expression("#pk = :pk AND begins_with(#sk, :file_snapshot)")
            .expression_attribute_names("#sk", "sk")
            .expression_attribute_names("#pk", "pk")
            .expression_attribute_values(
                ":file_snapshot",
                AttributeValue::S(format!(
                    "{}/{}",
                    snapshot_id.to_string(),
                    file_id.to_string()
                )),
            )
            .expression_attribute_values(
                ":pk",
                AttributeValue::S(format!("{}/{}", user_id, device_id)),
            )
            .send()
            .await?;

        let items = records_iter.items.expect("[Updates] Failed to list!");
        let records: Vec<Update> = items.iter().map(|v| v.into()).collect();

        Ok(records)
    }
}
