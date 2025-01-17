use std::sync::Arc;

use axum::{extract::State, http::StatusCode, Extension, Json};
use pyxis_db::{dynamo_client::Dynamo, payload::UpdateWritePayload};
use uuid::Uuid;

use crate::database::{
    token_repository::Claims,
    updates_repository::{Update, UpdateRepository},
};

#[axum_macros::debug_handler]
pub async fn updates_write(
    Extension(claims): Extension<Claims>,
    State(db): State<Arc<Dynamo>>,
    Json(update): Json<UpdateWritePayload>,
) -> Result<StatusCode, StatusCode> {
    let Claims {
        user,
        exp: _,
        iat: _,
    } = claims;

    let update_repository = UpdateRepository::new(db.connection.clone());

    let UpdateWritePayload {
        file_uid,
        snapshot_id,
        payload,
    } = update;

    let pk = format!("{}/{}", user.user_id, user.device_id);
    let sk = format!("{}/{}/{}", snapshot_id, file_uid, Uuid::new_v4());

    let update = Update { pk, sk, payload };

    let write_response = update_repository.create(update).await;

    if let Err(e) = write_response {
        println!("Error while writing updates! {}", e);
        return Err(StatusCode::INTERNAL_SERVER_ERROR);
    }

    Ok(StatusCode::OK)
}
