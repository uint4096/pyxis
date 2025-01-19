use aws_config as Config;
use aws_sdk_dynamodb as DynamoDB;
use std::{error::Error, sync::Arc};

pub struct Dynamo {
    pub connection: Arc<DynamoDB::client::Client>,
}

impl Dynamo {
    pub async fn new() -> Result<Dynamo, Box<dyn Error>> {
        let config = Config::load_from_env().await;
        let client = aws_sdk_dynamodb::Client::new(&config);

        Ok(Dynamo {
            connection: Arc::new(client),
        })
    }
}
