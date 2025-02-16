mod writer;

use pyxis_shared::database::Database;
use rusqlite::Error;
use sync_worker::sync_worker;

mod sync_worker;
use std::env;

fn get_pid_arg(args: Vec<String>) -> Option<i32> {
    for i in 1..args.len() {
        if args[i] == "--pid" && i + 1 < args.len() {
            return args[i + 1].parse().ok();
        }
    }

    None
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    let db = Database::create_connection("pyxis_sync");
    let connection = db.get_connection();
    let pid: Option<i32> = get_pid_arg(env::args().collect());

    sync_worker(&connection, pid).await
}
