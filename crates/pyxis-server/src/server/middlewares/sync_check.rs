use axum::{
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::Response,
};

use crate::{
    database::{
        features_repository::{Feature, FeaturesRepository},
        token_repository::Claims,
    },
    server::router::AWSConnectionState,
};

fn is_sync_enabled(user_features: &Option<Feature>) -> bool {
    return user_features
        .as_ref()
        .and_then(|features| features.features.get("sync"))
        .map(|value| value == "enabled")
        .unwrap_or(false);
}

#[axum_macros::debug_middleware]
pub async fn check_sync_feature(
    State(connections): State<AWSConnectionState>,
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let claims = request.extensions().get::<Claims>();
    println!("Claims: {:?}", claims);

    if claims.is_none() {
        eprintln!(
            "[Sync Check Middleware] Missing Claims. Endpoint: {}",
            request.uri().to_string(),
        );

        return Err(StatusCode::FORBIDDEN);
    }

    let claims = claims.unwrap();

    let features_repository = FeaturesRepository::new(connections.dynamo.connection.clone());
    match features_repository
        .get(claims.user.user_id.to_string())
        .await
    {
        Ok(user_features) => {
            if !is_sync_enabled(&user_features) {
                eprintln!(
                    "[Sync Check Middleware] Sync not enabled. Endpoint: {}",
                    request.uri().to_string(),
                );

                return Err(StatusCode::FORBIDDEN);
            }

            Ok(next.run(request).await)
        }
        Err(e) => {
            eprintln!(
                "[Sync Check Middleware] Unable to get features. Endpoint: {}, Error: {}",
                request.uri().to_string(),
                e
            );
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    }
}
