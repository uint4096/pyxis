use std::sync::Arc;

use axum::{
    extract::{Query, State},
    http::StatusCode,
    Extension, Json,
};
use crate::dynamo_client::Dynamo;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::database::{token_repository::Claims, updates_repository::UpdateRepository};

#[derive(Serialize, Deserialize)]
pub struct UpdatesListQuery {
    pub snapshot_id: i64,
    pub file_uid: String,
    pub device_id: String,
}

#[axum_macros::debug_handler]
pub async fn updates_list(
    Extension(claims): Extension<Claims>,
    State(db): State<Arc<Dynamo>>,
    Query(request): Query<UpdatesListQuery>,
) -> Result<Json<Value>, StatusCode> {
    let Claims {
        user,
        exp: _,
        iat: _,
    } = claims;

    let updates_repository = UpdateRepository::new(db.connection.clone());

    let UpdatesListQuery {
        snapshot_id,
        file_uid,
        device_id,
    } = request;

    let updates_response = updates_repository
        .get_by_snapshot_id(user.user_id.to_string(), device_id, file_uid, snapshot_id)
        .await;

    if let Ok(updates) = updates_response {
        let response = serde_json::json!({
            "updates": updates
        });

        return Ok(Json(response));
    }

    Err(StatusCode::INTERNAL_SERVER_ERROR)
}
