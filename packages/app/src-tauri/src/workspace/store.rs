use std::path::Path;

use crate::{
    reader::{read_file, FileContent},
    writer::write_file
};

#[derive(serde::Serialize, serde::Deserialize)]
struct Workspace {
    id: String,
    name: String,
}

#[derive(serde::Serialize, serde::Deserialize)]
struct StoreConfig {
    worspaces: Vec<Workspace>,
    last_selected_workspace: Workspace,
}

pub struct Store<'a> (pub &'a str);

impl<'a> Store<'a> {
    pub fn get_config(&self) -> FileContent {
        let config_path = Path::new(self.0);
        match config_path.join(".config").to_str() {
            Some(path) => {
                read_file(path)
            },
            None => {
                FileContent::new_failed()
            }
        }
    }

    pub fn save_config(&self, config: StoreConfig) -> bool {
        let config_path = Path::new(self.0);
        match config_path.join(".config").to_str() {
            Some(path) => {
                match serde_json::to_string(&config) {
                    Ok(config) => {
                        write_file(path, &config)
                    }
                    Err(e) => {
                        println!("[Store Error] Failed to serialize config! {e}");
                        false
                    }
                }
            },
            None => {
                false
            }
        }
       
    }
}
