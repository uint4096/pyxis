use crate::server::router::AWSConnectionState;
use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Deserialize;

use crate::database::{
    token_repository::{TokenRepository, UserToken},
    user_repository::UserRepository,
};

#[derive(Deserialize)]
pub struct SignInPayload {
    password: String,
    username: String,
    device_id: String,
}

#[axum_macros::debug_handler]
pub async fn sign_in(
    State(connections): State<AWSConnectionState>,
    Json(user): Json<SignInPayload>,
) -> Result<Json<UserToken>, Response> {
    let SignInPayload {
        password,
        username,
        device_id,
    } = user;

    let user_repository = UserRepository::new(connections.dynamo.connection.clone());
    let token_repository = TokenRepository::new(connections.dynamo.connection.clone());

    let user = match user_repository.verify(username, password, device_id).await {
        Ok(user) => user,
        Err(e) => {
            println!("Error while verifying password: {:?}", e);
            return Err((
                StatusCode::UNAUTHORIZED,
                format!("Password verification failed!"),
            )
                .into_response());
        }
    };

    if let Some(user) = user {
        if let Err(e) = token_repository
            .delete(&user.user_id, &user.device_id)
            .await
        {
            println!("Error while trying to delete existing tokens: {}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Internal server error"),
            )
                .into_response());
        }

        let user_token = match token_repository.create(user).await {
            Ok(token) => token,
            Err(e) => {
                println!("Error while trying to create token: {}", e);
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Internal server error"),
                )
                    .into_response());
            }
        };

        return Ok(Json(user_token));
    } else {
        return Err((
            StatusCode::UNAUTHORIZED,
            format!("Password verification failed!"),
        )
            .into_response());
    }
}
