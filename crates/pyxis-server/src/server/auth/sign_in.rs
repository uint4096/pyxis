use std::sync::Arc;

use axum::{extract::State, http::StatusCode, Json};
use pyxis_db::dynamo_client::Dynamo;
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
    State(db): State<Arc<Dynamo>>,
    Json(user): Json<SignInPayload>,
) -> Result<Json<UserToken>, StatusCode> {
    let SignInPayload {
        password,
        username,
        device_id,
    } = user;

    let user_repository = UserRepository::new(db.connection.clone());
    let token_repository = TokenRepository::new(db.connection.clone());

    let user = match user_repository.verify(username, password, device_id).await {
        Ok(user) => user,
        Err(e) => {
            println!("Error while verifying password: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    if let Some(user) = user {
        if let Err(e) = token_repository
            .delete(&user.user_id, &user.device_id)
            .await
        {
            println!("Error while trying to delete existing tokens: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }

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
