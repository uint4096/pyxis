use std::sync::Arc;

use super::{
    auth::{
        get_devices::get_devices, sign_in::sign_in, sign_out::sign_out, sign_up::sign_up,
        subscription_get::get_subscription, subscription_modify::modify_subscription,
    },
    middlewares::check_token,
    sync::{
        document_list::document_list, document_write::document_write, ping::ping,
        updates_list::updates_list, updates_write::updates_write,
    },
};
use crate::{dynamo_client::Dynamo, sns_client::SNS};
use axum::{
    handler::Handler,
    middleware,
    routing::{get, post},
    Router,
};

#[derive(Clone)]
pub struct AWSConnectionState {
    pub dynamo: Arc<Dynamo>,
    pub sns: Arc<SNS>,
}

pub fn create_route(dynamo: Arc<Dynamo>, sns: Arc<SNS>) -> Router {
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
        )
        .route(
            "/features",
            get(get_subscription.layer(middleware::from_fn(check_token))),
        )
        .route(
            "/features",
            post(modify_subscription.layer(middleware::from_fn(check_token))),
        );

    let sync_router = Router::new()
        .route("/ping", get(ping))
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
        .with_state(AWSConnectionState { dynamo, sns })
}
