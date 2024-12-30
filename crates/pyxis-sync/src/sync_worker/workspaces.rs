use super::sync::BackupSync;
use aws_sdk_dynamodb::types::AttributeValue;
use pyxis_db::entities::{config::Configuration, workspaces::Workspace};

pub type WorkspaceDocument = Workspace;

static TABLE_NAME: &str = "workspace_sync";

impl BackupSync for WorkspaceDocument {
    async fn write(
        client: &aws_sdk_dynamodb::Client,
        payload: String,
        configuration: Configuration,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let workspace = WorkspaceDocument::deserialize(&payload)?;

        let pk = format!(
            "{}/{}",
            configuration.user_id.unwrap().to_string(),
            configuration.device_id.unwrap().to_string()
        );
        let sk = workspace
            .id
            .expect("[Sync Worker] Workspace should have an id");

        let pk_av = AttributeValue::S(pk);
        let sk_av = AttributeValue::N(sk.to_string());
        let payload_av = AttributeValue::S(payload);

        let _ = client
            .put_item()
            .table_name(TABLE_NAME)
            .item("pk", pk_av)
            .item("sk", sk_av)
            .item("payload", payload_av)
            .send()
            .await;

        Ok(())
    }

    fn deserialize(payload: &str) -> Result<Self, Box<dyn std::error::Error>>
    where
        Self: Sized,
    {
        let workspace: Workspace = serde_json::from_str(payload)?;
        Ok(workspace)
    }
}
