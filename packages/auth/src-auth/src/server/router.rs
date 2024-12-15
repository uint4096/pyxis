use std::sync::Arc;

use crate::database::connection::Dynamo;

use super::{sign_in::sign_in, sign_out::sign_out, sign_up::sign_up};
use axum::{routing::post, Router};

pub fn create_route(connection: Arc<Dynamo>) -> Router {
    let app_router = Router::new()
        .route("/signup", post(sign_up))
        .route("/signin", post(sign_in))
        .route("/signout", post(sign_out))
        .with_state(connection);

    Router::new().nest("/auth", app_router)
}
