use axum::http::StatusCode;

#[axum_macros::debug_handler]
pub async fn ping() -> Result<StatusCode, StatusCode> {
    Ok(StatusCode::ACCEPTED)
}
