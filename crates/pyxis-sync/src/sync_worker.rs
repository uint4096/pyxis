mod sync;
mod workspaces;

use aws_sdk_dynamodb as DynamoDB;
use pyxis_db::entities::{config::Configuration, queue::ListenerQueue};
use rusqlite::{Connection, Error};

pub fn sync_worker(
    conn: &Connection,
    dynamoClient: &DynamoDB::client::Client,
) -> Result<(), Error> {
    loop {
        let config = Configuration::get(conn)?;
        let queue_element = ListenerQueue::dequeue(conn)?;
    }
}

/*
 * - Move DynamoDB module from auth to shared
 * - Remove all usages of FilesRaw and DirectoriesRaw. They are not needed
 * - Add `get` methods for all entities to get one of the data based on row_id.
 *   It should use the same joins as the `list` methods
 * - Use the `get` method created in the previous step in all the hooks
 */
