use std::sync::Arc;

use axum::{extract::State, http::StatusCode, Json};
use serde::Deserialize;
use uuid::Uuid;

use crate::database::{connection::Scylla, token_repository::TokenRepository};

#[derive(Deserialize)]
pub struct SignOutPayload {
    user_id: Uuid,
}

#[axum_macros::debug_handler]
pub async fn sign_out(
    State(db): State<Arc<Scylla>>,
    Json(user): Json<SignOutPayload>,
) -> Result<StatusCode, StatusCode> {
    let SignOutPayload { user_id } = user;

    let token_repository = TokenRepository::new(db.connection.clone());

    let delete_response = token_repository.delete(&user_id).await;

    if let Err(e) = delete_response {
        println!("Error while signing out! {}", e);
        return Err(StatusCode::INTERNAL_SERVER_ERROR);
    }

    Ok(StatusCode::OK)
}
