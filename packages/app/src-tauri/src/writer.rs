use std::fs::File;
use std::io::prelude::*;
use std::io::BufWriter;
use std::path::Path;

pub fn write_file(path: &str, content: &str) -> bool {
    let file_path = Path::new(path);
    if file_path.is_dir() {
        return false;
    }

    match File::open(path) {
        Ok(file) => {
            let mut writer = BufWriter::new(file);
            match writer.write_all(content.as_bytes()) {
                Ok(_) => true,
                Err(e) => {
                    println!("[Reader] Error while writing to file! {e}");
                    false
                }
            }
        }
        Err(e) => {
            println!("[Reader] Error while opening file! {e}");
            false
        }
    }
}
