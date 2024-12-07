use axum::Router;
use std::error::Error;

pub mod database;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let app = Router::new();
    
    let listener = tokio::net::TcpListener::bind("127.0.0.1:8080").await?;
    axum::serve(listener, app).await?;

    Ok(())
}
