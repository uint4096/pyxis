import { invoke } from "./invoke";

type Sources = "workspaces" | "directories" | "files" | "snapshots" | "updates";

type Args = {
  last_synced_record_id: { deviceId: string; sources: Array<Sources> };
};

export const getLastSyncedRecordId = async (
  deviceId: string,
  sources: Array<Sources>,
) => {
  try {
    return await invoke<Args, number>()("last_synced_record_id", {
      deviceId,
      sources,
    });
  } catch (e) {
    console.error("[Tracker] Failed to add devices!", e);
  }
};
