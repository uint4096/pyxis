use std::{fs::rename, path::Path};

use serde::{Deserialize, Serialize};

pub trait Actions<'a, T>
where
    T: Serialize + Deserialize<'a>,
{
    fn get_name(&self) -> &'a str;
    fn create(&self, path_to_dir: &'a str) -> bool;
    fn delete(&self, path_to_dir: &'a str) -> bool;
    fn rename(&self, path_to_dir: &str, new_name: &str) -> bool {
        let path = Path::new(path_to_dir);
        let old_name = path.join(self.get_name());
        let new_name = path.join(new_name);

        match rename(old_name, new_name) {
            Ok(_) => true,
            Err(e) => {
                println!("[File/Dir Actions] Error while renaming. {}", e);
                false
            }
        }
    }
}
