use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct UpdateWritePayload {
    pub payload: String,
    pub file_id: i64,
    pub snapshot_id: i64,
}

#[derive(Serialize, Deserialize)]
pub struct DocumentWritePayload {
    pub payload: String,
    pub operation: String,
    pub record_id: i64,
    pub source: String
}
