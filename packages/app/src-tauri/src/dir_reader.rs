use crate::document::dir::Directory;
use crate::document::file::File;
use nanoid::nanoid;
use std::fs;
use std::path::Path;

#[derive(serde::Serialize, serde::Deserialize)]
pub enum Entity {
    File(File),
    Dir(Directory),
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct DirContent {
    read_status: bool,
    entries: Option<Vec<Entity>>,
}

impl DirContent {
    pub fn new_failed() -> Self {
        DirContent {
            read_status: false,
            entries: None,
        }
    }
}

pub fn read_directory(path: &Path) -> DirContent {
    match fs::read_dir(path) {
        Ok(res) => {
            let mut entries: Vec<Entity> = vec![];
            for elem in res {
                match elem {
                    Ok(entry) => {
                        let path = entry.path();
                        let path = path.to_str().expect("Failed to convert path to str");

                        if entry.path().is_dir() {
                            let dir_entries = read_directory(entry.path().as_path());
                            if let Some(content) = dir_entries.entries {
                                entries.push(Entity::Dir(Directory {
                                    name: entry.file_name().into_string().unwrap(),
                                    id: nanoid!(10),
                                    content,
                                    path: path.to_string()
                                }));
                            } else {
                                return DirContent::new_failed();
                            }
                        } else if entry.path().is_file() {
                            let file_name = entry.file_name().into_string().unwrap();

                            /*
                             * @todo: Find a better, platform agnostic way (if possible) for determining if a file is hidden
                             */
                            let hidden = if file_name.starts_with('.') {
                                true
                            } else {
                                false
                            };

                            entries.push(Entity::File(File::new(
                                file_name,
                                path.to_string(),
                                hidden,
                            )));
                        }
                    }
                    Err(e) => {
                        println!("[Dir Reader] Error while reading directory! {}", e);
                        return DirContent::new_failed();
                    }
                }
            }

            DirContent {
                read_status: true,
                entries: Some(entries),
            }
        }
        Err(e) => {
            println!("[Dir Reader] Error while reading directory! {}", e);
            DirContent::new_failed()
        }
    }
}
