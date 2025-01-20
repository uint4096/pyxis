use std::error::Error;

use aws_config as Config;
use aws_sdk_sns::Client;

pub struct SNS {
    pub client: Client,
}

impl SNS {
    pub async fn create_client() -> Result<SNS, Box<dyn Error>> {
        let config = Config::load_from_env().await;
        Ok(SNS {
            client: Client::new(&config),
        })
    }
}
