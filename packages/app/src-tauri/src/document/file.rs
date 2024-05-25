use serde::{Deserialize, Serialize};

use crate::writer::write_file;
use std::path::Path;

#[derive(Serialize, Deserialize)]
pub struct Link (String, String);

#[derive(Serialize, Deserialize)]
pub struct File {
    name: String,
    title: String,
    tags: Vec<String>,
    owned_by: String,
    whitelisted_groups: Vec<String>,
    whitelisted_users: Vec<String>,
    created_at: String,
    updated_at: String,
    links: Vec<Link>
}

impl File {
    pub fn create(&self, path_to_dir: &str) -> bool {
        let file_path = Path::new(path_to_dir).join(&self.name);
        let path_str = file_path.to_str();
        if let Some(path) = path_str {
            return write_file(path, "");
        }

        false
    }
}
