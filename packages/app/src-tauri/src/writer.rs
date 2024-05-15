use std::fs::{OpenOptions, create_dir_all};
use std::io::prelude::*;
use std::io::BufWriter;
use std::path::Path;

pub fn write_file(path: &str, content: &str) -> bool {
    let file_path = Path::new(path);
    if file_path.is_dir() {
        return false;
    }

    if let Some(parent) = file_path.parent() {
        println!("[Writer] Parent: {}", parent.display());
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
            },
            Err(_) => {
                match create_dir_all(parent) {
                    Ok(_) => (),
                    Err(e) => {
                        println!("[Writer] Error while creating directory! {e}");
                        return false;
                    }
                }
            }
        }
    }

    match OpenOptions::new().write(true).create(true).open(path) {
        Ok(file) => {
            let mut writer = BufWriter::new(file);
            match writer.write_all(content.as_bytes()) {
                Ok(_) => {
                    // let _ = writer.flush().expect("Flush failed!");
                    true
                },
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
