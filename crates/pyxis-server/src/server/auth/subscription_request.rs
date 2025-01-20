use std::{collections::HashMap, env};

use axum::{extract::State, http::StatusCode, Extension};
use serde_json::json;

use crate::{
    database::{
        features_repository::{Feature, FeaturesRepository},
        token_repository::Claims,
    }, server::router::AWSConnectionState
};

#[axum_macros::debug_handler]
pub async fn request_subscription(
    Extension(claims): Extension<Claims>,
    State(connections): State<AWSConnectionState>,
) -> Result<StatusCode, StatusCode> {
    let AWSConnectionState { dynamo, sns } = connections;
    let client = sns.client.clone();
    let features_repostiory: FeaturesRepository = FeaturesRepository::new(dynamo.connection.clone());

    let Claims {
        user,
        exp: _,
        iat: _,
    } = claims;

    let feature = match features_repostiory.get(user.user_id.to_string()).await {
        Ok(features) => {
            if let Some(features) = features {
                let Feature {
                    user_id,
                    mut features,
                } = features;

                features.insert("sync".to_owned(), "requested".to_owned());

                Feature { user_id, features }
            } else {
                let mut features = HashMap::new();
                features.insert("sync".to_owned(), "requested".to_owned());

                Feature {
                    user_id: user.user_id.to_string(),
                    features,
                }
            }
        }
        Err(e) => {
            eprintln!("[Features] Failed to get existing features! Error: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    let create_response = features_repostiory.upsert(&feature).await;

    if let Ok(_) = create_response {
        match client
            .publish()
            .topic_arn(
                env::var("SUBSCRIPTION_REQUEST_SNS")
                    .expect("[Features] Subscription SNS topic should be specified"),
            )
            .message(json!(feature).to_string())
            .send()
            .await
        {
            Ok(_) => {
                return Ok(StatusCode::CREATED);
            }
            Err(e) => {
                eprintln!("[Features] Failed to send SNS notification! Error: {}", e);
                return Err(StatusCode::INTERNAL_SERVER_ERROR);
            }
        };
    }

    Err(StatusCode::INTERNAL_SERVER_ERROR)
}
