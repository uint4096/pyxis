use crate::server::router::AWSConnectionState;
use axum::{extract::State, http::StatusCode, Extension, Json};
use pyxis_shared::payload::DocumentWritePayload;
use serde_json::Value;

use crate::database::{
    documents_repository::{Document, DocumentRepository},
    token_repository::Claims,
};

#[axum_macros::debug_handler]
pub async fn document_write(
    Extension(claims): Extension<Claims>,
    State(connections): State<AWSConnectionState>,
    Json(document): Json<DocumentWritePayload>,
) -> Result<Json<Value>, StatusCode> {
    let Claims {
        user,
        exp: _,
        iat: _,
    } = claims;

    let document_repository = DocumentRepository::new(connections.dynamo.connection.clone());

    let pk = format!("{}/{}", user.user_id, user.device_id);
    let DocumentWritePayload {
        record_id,
        payload,
        operation,
        source,
        file_uid,
    } = document;

    let doc = Document {
        pk,
        sk: record_id,
        payload,
        operation,
        source,
        file_uid,
    };

    let write_response = document_repository.create(doc).await;

    if let Err(e) = write_response {
        println!("Error while writing documents! {}", e);
        return Err(StatusCode::INTERNAL_SERVER_ERROR);
    }

    if let Ok(record_id) = write_response {
        let response = serde_json::json!({
            "record_id": record_id
        });

        return Ok(Json(response));
    }

    Err(StatusCode::INTERNAL_SERVER_ERROR)
}
