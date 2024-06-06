use serde::{Deserialize, Serialize};

use crate::{
    reader::{read_file, FileContent},
    writer::write_file,
};
use std::{fs::remove_file, path::Path};

use super::actions::Actions;

#[derive(Serialize, Deserialize)]
pub struct Link(String, String);

#[derive(Serialize, Deserialize)]
/*
 * @todo: file path relative to the workspace
 * should also be a propery of the file.
 */
pub struct File {
    name: String,
    title: Option<String>,
    tags: Option<Vec<String>>,
    owned_by: Option<String>,
    whitelisted_groups: Option<Vec<String>>,
    whitelisted_users: Option<Vec<String>>,
    created_at: Option<String>,
    updated_at: Option<String>,
    links: Option<Vec<Link>>,
    hidden: bool,
}

impl File {
    pub fn new(name: String, hidden: bool) -> Self {
        File {
            name,
            created_at: None,
            links: None,
            owned_by: None,
            tags: None,
            title: None,
            updated_at: None,
            whitelisted_groups: None,
            whitelisted_users: None,
            hidden,
        }
    }

    pub fn read(&self, path_to_dir: &str) -> FileContent {
        let file_path = Path::new(path_to_dir).join(&self.get_name());
        if !Path::exists(&file_path) {
            return FileContent::new_failed();
        }

        read_file(
            file_path
                .to_str()
                .expect("Failed while converting path to string!"),
        )
    }

    pub fn write(&self, path_to_dir: &str, content: &str) -> bool {
        let file_path = Path::new(path_to_dir).join(&self.get_name());
        if !Path::exists(&file_path) {
            return false;
        }

        write_file(
            file_path
                .to_str()
                .expect("Failed while converting path to string!"),
            content,
        )
    }
}

impl<'a> Actions<'a, File> for File {
    fn create(&self, path_to_dir: &str) -> bool {
        let file_path = Path::new(path_to_dir).join(&self.get_name());
        if Path::exists(&file_path) {
            return false;
        }

        let path_str = file_path.to_str();
        if let Some(path) = path_str {
            return write_file(path, "");
        }

        false
    }

    fn delete(&self, path_to_dir: &str) -> bool {
        let file_path = Path::new(path_to_dir).join(&self.get_name());

        match remove_file(file_path) {
            Ok(_) => true,
            Err(e) => {
                println!("[File] Error while deleting file. {}", e);
                false
            }
        }
    }

    fn get_name(&self) -> String {
        self.name.clone()
    }
}
