use notify::{Config, RecommendedWatcher, RecursiveMode, Result, Watcher};

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

    pub fn watch(&self) {
        let path = self.config_path();
        let path = format!("{}/{}", path.to_owned(), ".conf.json");

        std::thread::spawn(move || -> Result<()> {
            println!("Started watching path {}", path);
            let (tx, rx) = std::sync::mpsc::channel();

            let mut watcher = RecommendedWatcher::new(tx, Config::default())?;

            watcher.watch(path.as_ref(), RecursiveMode::Recursive)?;

            for res in rx {
                match res {
                    Ok(event) => println!("Change: {event:?}"),
                    Err(error) => println!("Error: {error:?}"),
                }
            }

            Ok(())
        });
    }
}
