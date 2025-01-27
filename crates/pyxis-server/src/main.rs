pub mod database;
pub mod dynamo_client;
pub mod server;
pub mod sns_client;

use dotenv::dotenv;
use dynamo_client::Dynamo;
use server::router::create_route;
use sns_client::SNS;
use std::{env, error::Error, sync::Arc};

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    dotenv().ok();

    let dynamo = Dynamo::new().await?;
    let sns = SNS::create_client().await?;

    let app = create_route(Arc::new(dynamo), Arc::new(sns));

    let port = env::var("PORT").unwrap();

    let listener = tokio::net::TcpListener::bind(format!("127.0.0.1:{}", port)).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
