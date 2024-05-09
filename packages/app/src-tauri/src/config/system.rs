use super::configuration::Configuration;

#[derive(serde::Serialize, serde::Deserialize)]
pub struct SystemConfig {
    username: String,
    organization: String,
}

pub struct System<'a>(pub &'a str);

impl<'a> Configuration<'a, SystemConfig> for System<'a> {
    fn config_path(&self) -> &str {
        self.0
    }
}
