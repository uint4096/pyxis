use std::fs::File;
use std::io::prelude::*;
use std::io::BufReader;
use std::path::Path;

#[derive(serde::Serialize, serde::Deserialize)]
pub struct FileContent {
    read_status: bool,
    content: Option<String>,
}

impl FileContent {
    pub fn new_failed() -> Self {
        FileContent {
            read_status: false,
            content: None,
        }
    }
}

pub fn read_file(path: &str) -> FileContent {
    let file_path = Path::new(path);
    if file_path.is_dir() {
        return FileContent::new_failed();
    }

    match File::open(path) {
        Ok(file) => {
            let mut reader = BufReader::new(file);
            let mut content = String::new();

            match reader.read_to_string(&mut content) {
                Ok(_) => FileContent {
                    read_status: true,
                    content: Some(content),
                },
                Err(e) => {
                    println!("[Reader] Error while parsing lines! {e}");
                    FileContent::new_failed()
                }
            }
        }
        Err(e) => {
            println!("[Reader] Error while opening file! {e}");
            FileContent::new_failed()
        }
    }
}
