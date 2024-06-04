use serde::{Deserialize, Serialize};
use std::{
    fs::{create_dir_all, remove_dir_all},
    path::Path,
};

use super::actions::Actions;
use crate::dir_reader::Entity;

#[derive(Serialize, Deserialize)]

pub struct Directory {
    pub name: String,
    pub id: String,
    pub content: Vec<Entity>,
}

impl<'a> Actions<'a, Directory> for Directory {
    fn create(&self, path_to_dir: &str) -> bool {
        let dir_path = Path::new(path_to_dir).join(&self.get_name());

        match create_dir_all(dir_path) {
            Ok(_) => true,
            Err(e) => {
                println!("[Dir] Error while creating directory. {}", e);
                false
            }
        }
    }

    fn delete(&self, path_to_dir: &str) -> bool {
        let dir_path = Path::new(path_to_dir).join(&self.get_name());

        match remove_dir_all(dir_path) {
            Ok(_) => true,
            Err(e) => {
                println!("[Dir] Error while deleting directory. {}", e);
                false
            }
        }
    }

    fn get_name(&self) -> String {
        self.name.clone()
    }
}
