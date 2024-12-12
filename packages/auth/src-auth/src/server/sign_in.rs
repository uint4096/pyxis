use std::sync::Arc;

use axum::{extract::State, http::StatusCode, Json};
use serde::Deserialize;

use crate::database::{
    connection::Dynamo,
    token_repository::{TokenRepository, UserToken},
    user_repository::UserRepository,
};

#[derive(Deserialize)]
pub struct SignInPayload {
    password: String,
    username: String,
}

#[axum_macros::debug_handler]
pub async fn sign_in(
    State(db): State<Arc<Dynamo>>,
    Json(user): Json<SignInPayload>,
) -> Result<Json<UserToken>, StatusCode> {
    let SignInPayload { password, username } = user;

    let user_repository = UserRepository::new(db.connection.clone());
    let token_repository = TokenRepository::new(db.connection.clone());

    let user = match user_repository.verify(username, password).await {
        Ok(user) => user,
        Err(e) => {
            println!("Error while verifying password: {:?}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    if let Some(user) = user {
        let user_token = match token_repository.create(user).await {
            Ok(token) => token,
            Err(e) => {
                println!("Error while trying to create token: {}", e);
                return Err(StatusCode::INTERNAL_SERVER_ERROR);
            }
        };

        return Ok(Json(user_token));
    } else {
        return Err(StatusCode::UNAUTHORIZED);
    }
}
