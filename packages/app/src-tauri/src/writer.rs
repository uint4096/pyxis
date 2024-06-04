use std::fs::{create_dir_all, OpenOptions};
use std::io::prelude::*;
use std::io::BufWriter;
use std::path::Path;

pub fn write_file(path: &str, content: &str) -> bool {
    let file_path = Path::new(path);
    if file_path.is_dir() {
        return false;
    }

    if let Some(parent) = file_path.parent() {
        match parent.try_exists() {
            Ok(exists) => {
                if !exists {
                    match create_dir_all(parent) {
                        Ok(_) => (),
                        Err(e) => {
                            println!("[Writer] Error while creating directory! {e}");
                            return false;
                        }
                    }
                }
            }
            Err(_) => match create_dir_all(parent) {
                Ok(_) => (),
                Err(e) => {
                    println!("[Writer] Error while creating directory! {e}");
                    return false;
                }
            },
        }
    }

    match OpenOptions::new()
        .create(true)
        .write(true)
        .truncate(true)
        .open(path)
    {
        Ok(file) => {
            let mut writer = BufWriter::new(file);
            match writer.write_all(content.as_bytes()) {
                Ok(_) => {
                    // let _ = writer.flush().expect("Flush failed!");
                    true
                }
                Err(e) => {
                    println!("[Writer] Error while writing to file! {e}");
                    false
                }
            }
        }
        Err(e) => {
            println!("[Writer] Error while opening file! {e}");
            false
        }
    }
}
