import { toast } from "../utils";
import { invoke } from "./invoke";

export type FileContent = {
  id?: number;
  content?: Uint8Array;
  file_id: number;
  updated_at: string;
};

type Args = {
  update_content: { fileId: number; content: Uint8Array };
  get_content: { fileId: number };
};

export const updateContent = async (fileId: number, content: Uint8Array) => {
  try {
    if (
      !(await invoke<Args, boolean>()("update_content", {
        fileId,
        content,
      }))
    ) {
      toast("Failed to save! Your changes might be lost.");
    }
  } catch (e) {
    console.error("[Content] Failed to update! Error: ", e);
    toast("Failed to save! Your changes might be lost.");
  }
};

export const getContent = async (fileId: number) => {
  try {
    return (
      (await invoke<Args, Uint8Array>()("get_content", {
        fileId,
      })) ?? new Uint8Array()
    );
  } catch (e) {
    console.error("[Content] Failed to get content. Error: ", e);
    toast("Failed to get content!");
  }
};
