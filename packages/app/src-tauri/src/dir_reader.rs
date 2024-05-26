use nanoid::nanoid;
use std::fs;
use std::path::Path;

#[derive(serde::Serialize, serde::Deserialize)]
pub struct Directory {
    name: String,
    id: String,
    content: Vec<Entity>,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub enum Entity {
    File(String),
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
                        if entry.path().is_dir() {
                            let dir_entries = read_directory(entry.path().as_path());
                            if let Some(content) = dir_entries.entries {
                                entries.push(Entity::Dir(Directory {
                                    name: entry.file_name().into_string().unwrap(),
                                    id: nanoid!(10),
                                    content,
                                }));
                            } else {
                                return DirContent::new_failed();
                            }
                        } else if entry.path().is_file() {
                            entries.push(Entity::File(entry.file_name().into_string().unwrap()))
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
