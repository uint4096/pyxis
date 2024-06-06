use std::{fs::rename, path::Path};

use serde::{Deserialize, Serialize};

pub trait Actions<'a, T>
where
    T: Serialize + Deserialize<'a>,
{
    fn get_path(&self) -> String;
    fn create(&self) -> bool;
    fn delete(&self) -> bool;
    fn rename(&self, new_name: &str) -> bool {
        let file_path = self.get_path();
        let path = Path::new(&file_path);
        let new_path = path.join(new_name);

        match rename(path, new_path) {
            Ok(_) => true,
            Err(e) => {
                println!("[File/Dir Actions] Error while renaming. {}", e);
                false
            }
        }
    }
}
