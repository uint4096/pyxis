use std::{error::Error, sync::Arc};

use aws_sdk_dynamodb::{self as DynamoDB, types::AttributeValue};
use chrono::Utc;
use pyxis_db::entities::queue::Source;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Document {
    pub pk: String,
    pub sk: i64,
    pub payload: String,
    pub operation: String,
}

pub struct DocumentRepository {
    client: Arc<DynamoDB::Client>,
}

impl DocumentRepository {
    pub fn new(client: Arc<DynamoDB::Client>) -> Self {
        Self { client }
    }

    pub async fn create(&self, document: Document, source: Source) -> Result<i64, Box<dyn Error>> {
        let timestamp = Utc::now().timestamp();
        let Document {
            pk,
            sk,
            payload,
            operation,
        } = document;

        let pk_av = AttributeValue::S(pk);
        let sk_av = AttributeValue::N(sk.to_string());
        let payload_av = AttributeValue::S(payload);
        let op_av = AttributeValue::S(operation);
        let timestamp_av = AttributeValue::N(timestamp.to_string());

        let table_name = if source == Source::Snapshot {
            "snapshots_sync"
        } else {
            "documents_sync"
        };

        self.client
            .put_item()
            .table_name(table_name)
            .item("pk", pk_av)
            .item("sk", sk_av)
            .item("payload", payload_av)
            .item("operation", op_av)
            .item("timestamp", timestamp_av)
            .send()
            .await?;

        Ok(sk)
    }
}
