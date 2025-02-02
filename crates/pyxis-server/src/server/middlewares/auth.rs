use std::env;

use axum::{body::Body, extract::Request, http::StatusCode, middleware::Next, response::Response};

use jsonwebtoken::{decode, DecodingKey, TokenData, Validation};

use crate::database::token_repository::Claims;

pub async fn check_token(mut request: Request<Body>, next: Next) -> Result<Response, StatusCode> {
    let token: Vec<&str> = request
        .headers()
        .get("authorization")
        .and_then(|header| header.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?
        .split(' ')
        .collect();

    let token = token[1];

    let key = DecodingKey::from_secret(
        env::var("AUTH_SECRET")
            .expect("[Auth middleware] No authentication secret specified!")
            .as_bytes(),
    );

    match decode::<Claims>(
        token,
        &key,
        &Validation::new(jsonwebtoken::Algorithm::HS256),
    ) {
        Ok(TokenData { claims, header: _ }) => {
            println!("Inserting claims");
            request.extensions_mut().insert(claims);
            let response = next.run(request).await;
            Ok(response)
        }
        Err(e) => {
            println!(
                "[Auth Middleware] Failed to verify token signature. Endpoint: {}, Error: {}",
                request.uri().to_string(),
                e
            );
            Err(StatusCode::UNAUTHORIZED)
        }
    }
}
