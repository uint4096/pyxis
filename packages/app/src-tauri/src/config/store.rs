use super::configuration::Configuration;

#[derive(serde::Serialize, serde::Deserialize)]
struct Workspace {
    id: String,
    name: String,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct StoreConfig {
    workspaces: Vec<Workspace>,
    last_selected_workspace: Option<Workspace>,
}

pub struct Store<'a>(pub &'a str);

impl<'a> Configuration<'a, StoreConfig> for Store<'a> {
    fn config_path(&self) -> &str {
        self.0
    }
}
