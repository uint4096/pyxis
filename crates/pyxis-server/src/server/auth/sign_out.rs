use crate::server::router::AWSConnectionState;
use axum::{extract::State, http::StatusCode, Extension};

use crate::database::token_repository::{Claims, TokenRepository};

#[axum_macros::debug_handler]
pub async fn sign_out(
    Extension(claims): Extension<Claims>,
    State(connections): State<AWSConnectionState>,
) -> Result<StatusCode, StatusCode> {
    let Claims {
        user,
        exp: _,
        iat: _,
    } = claims;

    let token_repository = TokenRepository::new(connections.dynamo.connection.clone());

    let delete_response = token_repository
        .delete(&user.user_id, &user.device_id)
        .await;

    if let Err(e) = delete_response {
        println!("Error while signing out! {}", e);
        return Err(StatusCode::INTERNAL_SERVER_ERROR);
    }

    Ok(StatusCode::OK)
}
