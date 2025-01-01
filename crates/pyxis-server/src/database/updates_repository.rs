use std::{error::Error, sync::Arc};

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
}
