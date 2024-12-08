pub mod database;
pub mod server;

use database::connection::{Scylla, ScyllaCredentials};
use server::router::create_route;
use std::{env, error::Error, sync::Arc};

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let uri = env::var("SCYLLA_URI").expect("No database URL specified!");
    let username = env::var("SCYLLA_USERNAME").expect("No database user specified!");
    let password = env::var("SCYLLA_PASSWORD").expect("No database password specified!");

    let connection = Scylla::new(ScyllaCredentials {
        uri,
        username,
        password,
    })
    .await?;
    let app = create_route(Arc::new(connection));

    let listener = tokio::net::TcpListener::bind("127.0.0.1:8080").await?;
    axum::serve(listener, app).await?;

    Ok(())
}
