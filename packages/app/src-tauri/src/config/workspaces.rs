use super::configuration::Configuration;

#[derive(serde::Serialize, serde::Deserialize)]
enum Entity {
    File(String),
    Dir(String, Vec<Entity>),
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct WorkspaceConfig {
    id: String,
    name: String,
    users_allowed_read: Vec<String>,
    users_allowed_write: Vec<String>,
    tree: Vec<Entity>,
}

pub struct Workspace<'a>(pub &'a str);

impl<'a> Configuration<'a, WorkspaceConfig> for Workspace<'a> {
    fn config_path(&self) -> &str {
        self.0
    }
}
