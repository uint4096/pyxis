use std::sync::Arc;

use crate::database::connection::Dynamo;

use super::{middlewares, sign_in::sign_in, sign_out::sign_out, sign_up::sign_up};
use axum::{handler::Handler, middleware, routing::post, Router};

pub fn create_route(connection: Arc<Dynamo>) -> Router {
    let app_router = Router::new()
        .route("/signup", post(sign_up))
        .route("/signin", post(sign_in))
        .route(
            "/signout",
            post(sign_out.layer(middleware::from_fn(middlewares::check_token))),
        )
        .with_state(connection);

    Router::new().nest("/auth", app_router)
}
