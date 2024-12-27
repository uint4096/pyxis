import { toast } from "../utils";
import { invoke } from "./invoke";

export type Updates = {
  id?: number;
  content?: Uint8Array;
  file_id: number;
  updated_at: string;
  snapshot_id: string;
};

type Args = {
  insert_updates: { fileId: number; snapshotId: number; content: Uint8Array };
  get_updates: { fileId: number; snapshotId: number };
};

export const insertUpdates = async (
  fileId: number,
  snapshotId: number,
  content: Uint8Array,
) => {
  try {
    if (
      !(await invoke<Args, boolean>()("insert_updates", {
        fileId,
        content,
        snapshotId,
      }))
    ) {
      toast("Failed to save! Your changes might be lost.");
    }
  } catch (e) {
    console.error("[Updates] Failed to update! Error: ", e);
    toast("Failed to save! Your changes might be lost.");
  }
};

export const getUpdates = async (fileId: number, snapshotId: number) => {
  try {
    return (
      (await invoke<Args, Array<Uint8Array>>()("get_updates", {
        fileId,
        snapshotId,
      })) ?? []
    );
  } catch (e) {
    console.error("[Updates] Failed to get content. Error: ", e);
    toast("Failed to get content!");
  }
};
