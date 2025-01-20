use crate::server::router::AWSConnectionState;
use axum::{extract::State, http::StatusCode, Extension, Json};
use serde::Serialize;

use crate::database::{token_repository::Claims, user_repository::UserRepository};

#[derive(Serialize)]
pub struct DevicesResponse {
    devices: Vec<String>,
}

#[axum_macros::debug_handler]
pub async fn get_devices(
    State(connections): State<AWSConnectionState>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<DevicesResponse>, StatusCode> {
    let user_repository = UserRepository::new(connections.dynamo.connection.clone());
    match user_repository.get_devices(&claims.user.username).await {
        Ok(devices) => Ok(Json(DevicesResponse { devices })),
        Err(e) => {
            println!("Error while getting user: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    }
}
