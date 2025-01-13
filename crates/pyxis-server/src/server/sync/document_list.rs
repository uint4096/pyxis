use std::sync::Arc;

use axum::{
    extract::{Query, State},
    http::StatusCode,
    Extension, Json,
};
use pyxis_db::dynamo_client::Dynamo;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::database::{documents_repository::DocumentRepository, token_repository::Claims};

#[derive(Serialize, Deserialize)]
pub struct DocumentListQueries {
    pub record_id: i64,
    pub is_snapshot: bool,
    pub device_id: String,
}

#[axum_macros::debug_handler]
pub async fn document_list(
    Extension(claims): Extension<Claims>,
    State(db): State<Arc<Dynamo>>,
    Query(request): Query<DocumentListQueries>,
) -> Result<Json<Value>, StatusCode> {
    let Claims {
        user,
        exp: _,
        iat: _,
    } = claims;

    let document_repository = DocumentRepository::new(db.connection.clone());

    let DocumentListQueries {
        record_id,
        is_snapshot,
        device_id,
    } = request;

    let documents_response = document_repository
        .list_by_record_id(user.user_id.to_string(), device_id, record_id, is_snapshot)
        .await;

    if let Ok(documents) = documents_response {
        let response = serde_json::json!({
            "documents": documents
        });

        return Ok(Json(response));
    }

    Err(StatusCode::INTERNAL_SERVER_ERROR)
}
