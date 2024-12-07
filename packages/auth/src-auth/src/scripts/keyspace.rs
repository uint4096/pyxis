use scylla::{Session, SessionBuilder};
use std::{env, error::Error};

#[tokio::main]
pub async fn create_schema() -> Result<(), Box<dyn Error>> {
    let uri = env::var("SCYLLA_URI").expect("No database url specified");
    let username = env::var("SCYLLA_URI").expect("No database user specified");
    let password = env::var("SCYLLA_PWD").expect("No password specified");

    let session: Session = SessionBuilder::new()
        .known_node(uri)
        .user(username, password)
        .build()
        .await?;

    session
        .query_unpaged(
            "CREATE KEYSPACE IF NOT EXISTS pyxis_db WITH REPLICATION = \
            { 'class': 'NetworkTopologyStrategy', 'replication_factor' : 1 }",
            &[],
        )
        .await?;

    session.query_unpaged("DROP TABLE pyxis_db.users", &[]).await?;
    session
        .query_unpaged(
            "CREATE TABLE IF NOT EXISTS pyxis_db.users (\
            user_id uuid,\
            username text,\
            device_id uuid,\
            password text,\
            PRIMARY KEY((user_id, device_id))
        )",
            &[],
        )
        .await?;

    session.query_unpaged("DROP TABLE pyxis_db.user_tokens", &[]).await?;
    session
        .query_unpaged(
            "CREATE TABLE IF NOT EXISTS pyxis_db.user_tokens (\
            user_id uuid,\
            device_id uuid,\
            token text,\
            expiration_time timestamp,\
            PRIMARY KEY((user_id, device_id), timestamp)
        )",
            &[],
        )
        .await?;

    Ok(())
}
