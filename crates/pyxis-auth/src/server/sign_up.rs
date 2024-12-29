use std::sync::Arc;

use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::database::{
    connection::Dynamo,
    token_repository::{TokenRepository, UserToken},
    user_repository::{UserRepository, UserWithoutPassword},
};

#[derive(Deserialize)]
pub struct SignUpPayload {
    device_id: Uuid,
    password: String,
    username: String,
}

#[axum_macros::debug_handler]
pub async fn sign_up(
    State(db): State<Arc<Dynamo>>,
    Json(user): Json<SignUpPayload>,
) -> Result<Json<UserToken>, Response> {
    let SignUpPayload {
        device_id,
        password,
        username,
    } = user;

    let user_repository = UserRepository::new(db.connection.clone());
    let token_repository = TokenRepository::new(db.connection.clone());

    match user_repository.get(&username).await {
        Ok(user) => {
            if let Some(_) = user {
                println!("Username taken!");
                return Err((StatusCode::CONFLICT, format!("Username taken!")).into_response());
            }
        }
        Err(e) => {
            println!("Error while trying to validate username: {}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Signup failed! Unable to fetch username."),
            )
                .into_response());
        }
    };

    let user_id = Uuid::new_v4();
    let user = match user_repository
        .create(
            UserWithoutPassword {
                device_id,
                username,
                user_id,
            },
            password,
        )
        .await
    {
        Ok(user) => user,
        Err(e) => {
            println!("Error while trying to create user: {}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Signup failed! Error while creating user."),
            )
                .into_response());
        }
    };

    let user_token = match token_repository.create(user).await {
        Ok(token) => token,
        Err(e) => {
            println!("Error while trying to create token: {}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Signup failed! Error while creating token."),
            )
                .into_response());
        }
    };

    return Ok(Json(user_token));
}
