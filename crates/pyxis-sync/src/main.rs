mod writer;

use pyxis_db::database::Database;
use rusqlite::Error;
use sync_worker::sync_worker;

mod sync_worker;

#[tokio::main]
async fn main() -> Result<(), Error> {
    let db = Database::create_connection("pyxis_config");
    let connection = db.get_connection();

    sync_worker(&connection).await
}
