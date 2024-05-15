use crate::{
    reader::{read_file, FileContent},
    writer::write_file,
};
use serde::{Deserialize, Serialize};
use std::path::Path;

pub trait Configuration<'a, T>
where
    T: Serialize + Deserialize<'a>,
{
    fn config_path(&self) -> &str;
    fn get_config(&self) -> FileContent {
        let path = &self.config_path();
        let config_path = Path::new(path);
        match config_path.join("conf.json").to_str() {
            Some(path) => read_file(path),
            None => FileContent::new_failed(),
        }
    }

    fn save_config(&self, config: T) -> bool {
        let path = &self.config_path();
        let config_path = Path::new(path);
        match config_path.join("conf.json").to_str() {
            Some(path) => match serde_json::to_string(&config) {
                Ok(config) => write_file(path, &config),
                Err(e) => {
                    println!("[Config Error] Failed to serialize config! {e}");
                    false
                }
            },
            None => false,
        }
    }
}
