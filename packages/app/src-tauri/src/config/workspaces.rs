use crate::dir_reader::{read_directory, DirContent, Entity};
use std::path::Path;

use super::configuration::Configuration;

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

impl<'a> Workspace<'a> {
    pub fn read_dir(&self) -> DirContent {
        read_directory(Path::new(self.config_path()))
    }
}
