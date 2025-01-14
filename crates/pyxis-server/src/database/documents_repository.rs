use std::{collections::HashMap, error::Error, str::FromStr, sync::Arc};

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
    pub source: String,
    pub file_id: Option<i64>,
}

impl From<&HashMap<String, AttributeValue>> for Document {
    fn from(value: &HashMap<String, AttributeValue>) -> Self {
        Document {
            pk: value
                .get("pk")
                .and_then(|v| v.as_s().ok())
                .cloned()
                .expect("pk should exist"),
            sk: value
                .get("sk")
                .and_then(|v| v.as_n().ok())
                .cloned()
                .expect("sk should exist")
                .parse::<i64>()
                .unwrap(),
            payload: value
                .get("payload")
                .and_then(|v| v.as_s().ok())
                .cloned()
                .expect("payload should exist"),
            operation: value
                .get("operation")
                .and_then(|v| v.as_s().ok())
                .cloned()
                .expect("operation should exist"),
            source: value
                .get("source")
                .and_then(|v| v.as_s().ok())
                .cloned()
                .expect("source should exist"),
            file_id: value
                .get("file_id")
                .and_then(|v| v.as_n().ok())
                .and_then(|s| s.parse().ok()),
        }
    }
}

pub struct DocumentRepository {
    client: Arc<DynamoDB::Client>,
}

impl DocumentRepository {
    pub fn new(client: Arc<DynamoDB::Client>) -> Self {
        Self { client }
    }

    pub async fn create(&self, document: Document) -> Result<i64, Box<dyn Error>> {
        let timestamp = Utc::now().timestamp();
        let Document {
            pk,
            sk,
            payload,
            operation,
            source,
            file_id,
        } = document;

        let pk_av = AttributeValue::S(pk);
        let sk_av = AttributeValue::N(sk.to_string());
        let payload_av = AttributeValue::S(payload);
        let op_av = AttributeValue::S(operation);
        let timestamp_av = AttributeValue::N(timestamp.to_string());
        let source_av = AttributeValue::S(source.to_string());

        let table_name = if Source::from_str(&source).unwrap() == Source::Snapshot {
            "snapshots_sync"
        } else {
            "documents_sync"
        };

        let query = self
            .client
            .put_item()
            .table_name(table_name)
            .item("pk", pk_av)
            .item("sk", sk_av)
            .item("payload", payload_av)
            .item("operation", op_av)
            .item("timestamp", timestamp_av)
            .item("source", source_av);

        if let Some(file_id) = file_id {
            let file_id_av = AttributeValue::N(file_id.to_string());
            query.item("file_id", file_id_av).send().await?;
        } else {
            query.send().await?;
        }

        Ok(sk)
    }

    pub async fn list_by_record_id(
        &self,
        user_id: String,
        device_id: String,
        record_id: i64,
        is_snapshot: bool,
    ) -> Result<Vec<Document>, Box<dyn Error>> {
        let table_name = if is_snapshot {
            "snapshot_sync"
        } else {
            "documents_sync"
        };

        let records_iter = self
            .client
            .query()
            .table_name(table_name)
            .key_condition_expression("#pk = :pk AND #record_id > :record_id")
            .expression_attribute_names("#record_id", "sk")
            .expression_attribute_names("#pk", "pk")
            .expression_attribute_values(":record_id", AttributeValue::N(record_id.to_string()))
            .expression_attribute_values(
                ":pk",
                AttributeValue::S(format!("{}/{}", user_id, device_id)),
            )
            .send()
            .await?;

        let items = records_iter
            .items
            .expect("[Documents] Failed to get synced documents");
        let records: Vec<Document> = items.iter().map(|v| v.into()).collect();

        Ok(records)
    }
}
