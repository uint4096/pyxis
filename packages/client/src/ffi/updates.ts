import { invoke } from "./invoke";

export type Updates = {
  id?: number;
  content?: Uint8Array;
  file_uid: string;
  updated_at: string;
  snapshot_id: string;
};

type Args = {
  insert_updates: { fileUid: string; snapshotId: number; content: Uint8Array };
  get_updates: { fileUid: string; snapshotId: number };
};

export const insertUpdates = async (
  fileUid: string,
  snapshotId: number,
  content: Uint8Array,
) => {
  try {
    if (
      !(await invoke<Args, boolean>()("insert_updates", {
        fileUid,
        content,
        snapshotId,
      }))
    ) {
      throw new Error("Empty Response!");
    }
  } catch (e) {
    console.error("[Updates] Failed to update! Error: ", e);
    throw e;
  }
};

export const getUpdates = async (fileUid: string, snapshotId: number) => {
  try {
    return (
      (await invoke<Args, Array<Uint8Array>>()("get_updates", {
        fileUid,
        snapshotId,
      })) ?? []
    );
  } catch (e) {
    console.error("[Updates] Failed to get content. Error: ", e);
    throw e;
  }
};
