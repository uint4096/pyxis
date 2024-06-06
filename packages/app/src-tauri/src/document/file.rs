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
    path: String,
}

impl File {
    pub fn new(name: String, path: String, hidden: bool) -> Self {
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
            path,
        }
    }

    pub fn read(&self) -> FileContent {
        if !Path::exists(Path::new(&self.path)) {
            return FileContent::new_failed();
        }

        read_file(&self.path)
    }

    pub fn write(&self, content: &str) -> bool {
        if !Path::exists(Path::new(&self.path)) {
            return false;
        }

        write_file(&self.path, content)
    }
}

impl<'a> Actions<'a, File> for File {
    fn create(&self) -> bool {
        if Path::exists(Path::new(&self.path)) {
            return false;
        }

        write_file(&self.path, "")
    }

    fn delete(&self) -> bool {
        match remove_file(Path::new(&self.path)) {
            Ok(_) => true,
            Err(e) => {
                println!("[File] Error while deleting file. {}", e);
                false
            }
        }
    }

    fn get_path(&self) -> String {
        self.path.clone()
    }
}
