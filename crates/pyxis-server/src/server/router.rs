use std::sync::Arc;

use super::{
    auth::{
        get_devices::get_devices, sign_in::sign_in, sign_out::sign_out, sign_up::sign_up,
        subscription_get::get_subscription, subscription_modify::modify_subscription,
    },
    middlewares::auth::check_token,
    middlewares::sync_check::check_sync_feature,
    sync::{
        document_list::document_list, document_write::document_write, ping::ping,
        updates_list::updates_list, updates_write::updates_write,
    },
};
use crate::{dynamo_client::Dynamo, sns_client::SNS};
use axum::{
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
    let protected_auth_routes = Router::new()
        .route("/signout", post(sign_out))
        .route("/devices", get(get_devices))
        .route("/features", get(get_subscription))
        .route("/features", post(modify_subscription))
        .layer(middleware::from_fn(check_token));

    let auth_router = Router::new()
        .merge(protected_auth_routes)
        .route("/signup", post(sign_up))
        .route("/signin", post(sign_in));

    let state = AWSConnectionState {
        dynamo: dynamo.clone(),
        sns: sns.clone(),
    };

    let protected_sync_router = Router::new()
        .route("/document/write", post(document_write))
        .route("/document/list", get(document_list))
        .route("/update/write", post(updates_write))
        .route("/update/list", get(updates_list))
        .layer(middleware::from_fn_with_state(state, check_sync_feature))
        .layer(middleware::from_fn(check_token));

    let sync_router = Router::new()
        .merge(protected_sync_router)
        .route("/ping", get(ping));

    Router::new()
        .nest("/auth", auth_router)
        .nest("/sync", sync_router)
        .with_state(AWSConnectionState { dynamo, sns })
}
