pub mod database;
pub mod server;
pub mod dynamo_client;

use dotenv::dotenv;
use dynamo_client::Dynamo;
use server::router::create_route;
use std::{error::Error, sync::Arc};

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    dotenv().ok();

    let dynamo = Dynamo::new().await?;

    let app = create_route(Arc::new(dynamo));

    let listener = tokio::net::TcpListener::bind("127.0.0.1:8080").await?;
    axum::serve(listener, app).await?;

    Ok(())
}
