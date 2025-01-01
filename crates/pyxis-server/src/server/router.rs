use std::sync::Arc;

use super::{
    auth::{sign_in::sign_in, sign_out::sign_out, sign_up::sign_up},
    middlewares::check_token,
    sync::{document_write::document_write, updates_write::updates_write},
};
use axum::{handler::Handler, middleware, routing::post, Router};
use pyxis_db::dynamo_client::Dynamo;

pub fn create_route(connection: Arc<Dynamo>) -> Router {
    let auth_router = Router::new()
        .route("/signup", post(sign_up))
        .route("/signin", post(sign_in))
        .route(
            "/signout",
            post(sign_out.layer(middleware::from_fn(check_token))),
        );

    let sync_router = Router::new()
        .route(
            "/document/write",
            post(document_write.layer(middleware::from_fn(check_token))),
        )
        .route(
            "/updates/write",
            post(updates_write.layer(middleware::from_fn(check_token))),
        );

    Router::new()
        .nest("/auth", auth_router)
        .nest("/sync", sync_router)
        .with_state(connection)
}
