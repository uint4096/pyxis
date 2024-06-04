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
            let reader = BufReader::new(file);
            let mut lines = reader.lines();
            let mut content = String::new();
            while let Some(line) = lines.next() {
                match line {
                    Ok(line) => {
                        content = content + &line;
                    }
                    Err(e) => {
                        println!("[Reader] Error while parsing lines! {e}");
                    }
                }
            }
            FileContent {
                read_status: true,
                content: Some(content),
            }
        }
        Err(e) => {
            println!("[Reader] Error while opening file! {e}");
            FileContent::new_failed()
        }
    }
}
