use std::{collections::HashMap, env};

use axum::{extract::State, http::StatusCode, Extension, Json};
use serde::Deserialize;
use serde_json::json;

use crate::{
    database::{
        features_repository::{Feature, FeaturesRepository},
        token_repository::Claims,
    },
    server::router::AWSConnectionState,
};

#[derive(Deserialize)]
pub struct SubscriptionPayload {
    pub key: String,
    pub value: String,
}

#[axum_macros::debug_handler]
pub async fn modify_subscription(
    Extension(claims): Extension<Claims>,
    State(connections): State<AWSConnectionState>,
    Json(payload): Json<SubscriptionPayload>,
) -> Result<StatusCode, StatusCode> {
    let AWSConnectionState { dynamo, sns } = connections;
    let client = sns.client.clone();
    let features_repostiory: FeaturesRepository =
        FeaturesRepository::new(dynamo.connection.clone());

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

                features.insert(payload.key, payload.value.to_string());

                Feature { user_id, features }
            } else {
                let mut features = HashMap::new();
                features.insert(payload.key, payload.value.to_string());

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
        if payload.value == String::from("requested") {
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
                    println!("Published message");
                    return Ok(StatusCode::CREATED);
                }
                Err(e) => {
                    eprintln!("[Features] Failed to send SNS notification! Error: {:?}", e);
                    return Err(StatusCode::INTERNAL_SERVER_ERROR);
                }
            };
        }
    } else {
        if let Err(e) = create_response {
            eprintln!("Error while creating subscription. {}", e);
        }
    }

    Err(StatusCode::INTERNAL_SERVER_ERROR)
}
