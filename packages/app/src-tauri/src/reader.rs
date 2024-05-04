use std::io::prelude::*;
use std::io::BufReader;
use std::fs::File;
use std::path::Path;
use serde::ser::{Serialize, Serializer, SerializeStruct};

pub struct FileContent {
    read_status: bool,
    content: Option<String>
}

impl Serialize for FileContent {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_struct("FileContent", 2)?;
        state.serialize_field("read_status", &self.read_status)?;
        state.serialize_field("content", &self.content)?;
        state.end()
    }
}

pub fn read_file(path: &str) -> FileContent {
    let file_path = Path::new(path);
    if file_path.is_dir() {
        return FileContent {
            read_status: false,
            content: None
        };
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
                content: Some(content)
            }
        }
        Err(e) => {
            println!("[Reader] Error while reading files! {e}");
            FileContent {
                read_status: false,
                content: None
            }
        }
    }
}
