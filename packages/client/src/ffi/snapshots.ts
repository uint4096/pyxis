import { toast } from "../utils";
import { invoke } from "./invoke";

export type Snapshot = {
  id?: number;
  content?: Uint8Array;
  file_uid: number;
  updated_at: string;
  snapshot_id: number;
};

type Args = {
  update_snapshot: { fileUid: string; content: Uint8Array };
  get_snapshot: { fileUid: string };
};

export const updateSnapshot = async (fileUid: string, content: Uint8Array) => {
  try {
    if (
      !(await invoke<Args, boolean>()("update_snapshot", {
        fileUid,
        content,
      }))
    ) {
      toast("Failed to save! Your changes might be lost.");
    }
  } catch (e) {
    console.error("[Snapshot] Failed to update! Error: ", e);
    toast("Failed to save! Your changes might be lost.");
  }
};

export const getSnapshot = async (fileUid: string) => {
  try {
    return (
      (await invoke<Args, Snapshot>()("get_snapshot", {
        fileUid,
      })) ?? new Uint8Array()
    );
  } catch (e) {
    console.error("[Snapshot] Failed to get content. Error: ", e);
    toast("Failed to get content!");
  }
};
