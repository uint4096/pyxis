use std::{collections::HashMap, error::Error, sync::Arc};

use aws_sdk_dynamodb::{self as DynamoDB, types::AttributeValue};
use serde::{Deserialize, Serialize};

static TABLE_NAME: &str = "user_features";

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Feature {
    pub user_id: String,
    pub features: HashMap<String, String>,
}

impl From<&HashMap<String, AttributeValue>> for Feature {
    fn from(value: &HashMap<String, AttributeValue>) -> Self {
        Feature {
            user_id: value
                .get("user_id")
                .and_then(|v| v.as_s().ok())
                .cloned()
                .expect("user_id should exist"),
            features: value
                .get("features")
                .and_then(|v| v.as_m().ok())
                .map(|m| convert_map_to_json(m))
                .expect("features should exist"),
        }
    }
}

fn convert_map_to_json(map: &HashMap<String, AttributeValue>) -> HashMap<String, String> {
    map.iter()
        .filter_map(|(k, v)| v.as_s().ok().map(|s| (k.clone(), s.to_string())))
        .collect()
}

fn convert_json_to_map(json: &HashMap<String, String>) -> HashMap<String, AttributeValue> {
    json.iter()
        .filter_map(|(k, v)| Some((k.clone(), AttributeValue::S(v.to_string()))))
        .collect()
}

pub struct FeaturesRepository {
    client: Arc<DynamoDB::Client>,
}

impl FeaturesRepository {
    pub fn new(client: Arc<DynamoDB::Client>) -> Self {
        Self { client }
    }

    pub async fn upsert(&self, features: &Feature) -> Result<(), Box<dyn Error + Send + Sync>> {
        let Feature { user_id, features } = features;

        let user_id_av = AttributeValue::S(user_id.to_owned());
        let features_av = AttributeValue::M(convert_json_to_map(&features));

        self.client
            .update_item()
            .table_name(TABLE_NAME)
            .key("user_id", user_id_av.clone())
            .update_expression("SET #features = :features")
            .expression_attribute_names("#features", "features")
            .expression_attribute_values(":features", features_av)
            .send()
            .await
            .map_err(|err| Box::new(err) as Box<dyn std::error::Error + Send + Sync>)?;

        Ok(())
    }

    pub async fn get(
        &self,
        user_id: String,
    ) -> Result<Option<Feature>, Box<dyn std::error::Error + Send + Sync>> {
        let feature = self
            .client
            .get_item()
            .table_name(TABLE_NAME)
            .key("user_id", AttributeValue::S(user_id))
            .send()
            .await?;

        let records: Option<Feature> = feature.item().and_then(|v| Some(Feature::from(v)));

        Ok(records)
    }
}
