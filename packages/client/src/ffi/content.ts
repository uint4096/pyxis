import { toast } from "../utils";
import { invoke } from "./invoke";

export type FileContent = {
  id?: number;
  content?: string;
  file_id: number;
  updated_at: string;
};

type Args = {
  update_content: { fileId: number; content: string };
  get_content: { fileId: number };
};

export const updateContent = async (fileId: number, content: string) => {
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
    return await invoke<Args, string>()("get_content", {
      fileId,
    });
  } catch (e) {
    console.error("[Content] Failed to get content. Errror: ", e);
    toast("Failed to get content!");
  }
};
