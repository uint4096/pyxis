import { invoke } from "./invoke";

export type Sources =
  | "workspaces"
  | "directories"
  | "files"
  | "snapshots"
  | "updates";

type Args = {
  last_synced_record_id: { deviceId: string; sources: Array<Sources> };
  add_record: { deviceId: string; source: Sources; recordId: number };
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

export const addSyncedRecord = async (
  deviceId: string,
  source: Sources,
  recordId: number,
) => {
  try {
    const success = await invoke<Args, boolean>()("add_record", {
      deviceId,
      source,
      recordId,
    });

    if (!success) {
      throw new Error("[Tracker] Failed to add record! Handler failed.");
    }
  } catch (e) {
    console.error("[Tracker] Failed to add record!", e);
  }
};
