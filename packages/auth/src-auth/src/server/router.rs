use std::sync::Arc;

use super::{sign_in::sign_in, sign_out::sign_out, sign_up::sign_up};
use crate::database::connection::Scylla;
use axum::{routing::post, Router};

pub fn create_route(connection: Arc<Scylla>) -> Router {
    Router::new()
        .route("/signup", post(sign_up))
        .route("/signin", post(sign_in))
        .route("/signout", post(sign_out))
        .with_state(connection)
}
