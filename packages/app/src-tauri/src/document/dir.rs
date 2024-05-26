use serde::{Deserialize, Serialize};
use std::{
    fs::{create_dir_all, remove_dir},
    path::Path,
};

use super::actions::Actions;

#[derive(Serialize, Deserialize)]
pub struct Dir<'a>(&'a str);

impl<'a> Actions<'a, Dir<'a>> for Dir<'a> {
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

        match remove_dir(dir_path) {
            Ok(_) => true,
            Err(e) => {
                println!("[Dir] Error while deleting directory. {}", e);
                false
            }
        }
    }

    fn get_name(&self) -> &'a str {
        self.0
    }
}
