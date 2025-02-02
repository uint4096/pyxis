use crate::{
    database::features_repository::{Feature, FeaturesRepository},
    server::router::AWSConnectionState,
};
use axum::{extract::State, http::StatusCode, Extension, Json};
use serde::Serialize;

use crate::database::token_repository::Claims;

#[derive(Serialize)]
pub struct FeaturesResponse {
    pub features: Option<Feature>,
}

#[axum_macros::debug_handler]
pub async fn get_subscription(
    State(connections): State<AWSConnectionState>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<FeaturesResponse>, StatusCode> {
    let features_repository = FeaturesRepository::new(connections.dynamo.connection.clone());
    match features_repository
        .get(claims.user.user_id.to_string())
        .await
    {
        Ok(features) => Ok(Json(FeaturesResponse { features })),
        Err(e) => {
            println!("Error while getting features: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    }
}
