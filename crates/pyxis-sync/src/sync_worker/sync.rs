use aws_sdk_dynamodb as DynamoDB;
use pyxis_db::entities::config::Configuration;
use std::error::Error;

pub trait BackupSync {
    fn deserialize(payload: &str) -> Result<Self, Box<dyn Error>>
    where
        Self: Sized;
    async fn write(
        client: &DynamoDB::Client,
        payload: String,
        configuration: Configuration,
    ) -> Result<(), Box<dyn Error>>;
}
