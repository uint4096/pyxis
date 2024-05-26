use serde::{Deserialize, Serialize};

use crate::writer::write_file;
use std::{fs::remove_file, path::Path};

use super::actions::Actions;

#[derive(Serialize, Deserialize)]
pub struct Link(String, String);

#[derive(Serialize, Deserialize)]
pub struct File<'a> {
    name: &'a str,
    title: String,
    tags: Vec<&'a str>,
    owned_by: &'a str,
    whitelisted_groups: Vec<&'a str>,
    whitelisted_users: Vec<&'a str>,
    created_at: &'a str,
    updated_at: &'a str,
    links: Vec<Link>,
}

impl<'a> Actions<'a, File<'a>> for File<'a> {
    fn create(&self, path_to_dir: &str) -> bool {
        let file_path = Path::new(path_to_dir).join(&self.name);
        let path_str = file_path.to_str();
        if let Some(path) = path_str {
            return write_file(path, "");
        }

        false
    }

    fn delete(&self, path_to_dir: &str) -> bool {
        let file_path = Path::new(path_to_dir).join(&self.name);

        match remove_file(file_path) {
            Ok(_) => true,
            Err(e) => {
                println!("[File] Error while deleting file. {}", e);
                false
            }
        }
    }

    fn get_name(&self) -> &'a str {
        self.name
    }
}
