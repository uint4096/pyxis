use std::sync::Arc;

use super::{
    auth::{get_devices::get_devices, sign_in::sign_in, sign_out::sign_out, sign_up::sign_up},
    middlewares::check_token,
    sync::{
        document_list::document_list, document_write::document_write, ping::ping, updates_list::{self, updates_list}, updates_write::updates_write
    },
};
use axum::{
    handler::Handler,
    middleware,
    routing::{get, post},
    Router,
};
use pyxis_db::dynamo_client::Dynamo;

pub fn create_route(connection: Arc<Dynamo>) -> Router {
    let auth_router = Router::new()
        .route("/signup", post(sign_up))
        .route("/signin", post(sign_in))
        .route(
            "/signout",
            post(sign_out.layer(middleware::from_fn(check_token))),
        )
        .route(
            "/devices",
            get(get_devices.layer(middleware::from_fn(check_token))),
        );

    let sync_router = Router::new()
        .route(
            "/ping",
            get(ping)
        )
        .route(
            "/document/write",
            post(document_write.layer(middleware::from_fn(check_token))),
        )
        .route(
            "/document/list",
            get(document_list.layer(middleware::from_fn(check_token))),
        )
        .route(
            "/update/write",
            post(updates_write.layer(middleware::from_fn(check_token))),
        )
        .route(
            "/update/list",
            get(updates_list.layer(middleware::from_fn(check_token))),
        );

    Router::new()
        .nest("/auth", auth_router)
        .nest("/sync", sync_router)
        .with_state(connection)
}
