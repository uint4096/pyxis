use std::{error::Error, sync::Arc};

use scylla::{Session, SessionBuilder};

pub struct ScyllaCredentials {
    pub uri: String,
    pub username: String,
    pub password: String,
}

pub struct Scylla {
    pub connection: Arc<Session>,
}

impl Scylla {
    pub async fn new(creds: ScyllaCredentials) -> Result<Scylla, Box<dyn Error>> {
        let ScyllaCredentials {
            uri,
            username,
            password,
        } = creds;

        let session = SessionBuilder::new()
            .known_node(uri)
            .user(username, password)
            .build()
            .await?;

        Ok(Scylla {
            connection: Arc::new(session),
        })
    }
}
