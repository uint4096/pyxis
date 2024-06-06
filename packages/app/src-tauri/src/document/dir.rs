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
    pub path: String
}

impl<'a> Actions<'a, Directory> for Directory {
    fn create(&self) -> bool {
        match create_dir_all(&self.path) {
            Ok(_) => true,
            Err(e) => {
                println!("[Dir] Error while creating directory. {}", e);
                false
            }
        }
    }

    fn delete(&self) -> bool {
        match remove_dir_all(&self.path) {
            Ok(_) => true,
            Err(e) => {
                println!("[Dir] Error while deleting directory. {}", e);
                false
            }
        }
    }

    fn get_path(&self) -> String {
        self.path.clone()
    }
}
