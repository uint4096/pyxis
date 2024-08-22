import { toast } from "../utils";
import { invoke } from "./invoke_v2";

export type Directory = {
  id?: number;
  uid: string;
  name: string;
  path: string;
  workspace_uid: string;
  parent_uid?: string;
  created_at: string;
  updated_at: string;
};

type Args = {
  list_dirs: { workspaceUid: string; parentUid?: string };
  create_dir: {
    name: string;
    workspaceUid: string;
    path: string;
    parentUid?: string;
  };
  delete_dir: { uid: string };
  update_dir: {
    uid: string;
    name: string;
    workspaceUid: string;
    path: string;
    parentUid?: string;
  };
};

export const createDir = async (
  name: string,
  workspaceUid: string,
  path: string,
  parentUid?: string,
) => {
  try {
    const directory = await invoke<Args, Directory | null>()("create_dir", {
      name,
      path,
      workspaceUid,
      parentUid,
    });

    if (!directory) {
      toast("Failed to create directory!", "error");
      return;
    }

    toast("Directory created!");

    return directory;
  } catch (e) {
    console.error("[Directory] Create failed!", e);
    toast("Failed to create directory!", "error");
  }
};

export const getDirs = async (workspaceUid: string, parentUid?: string) => {
  try {
    const directories = await invoke<Args, Array<Directory>>()("list_dirs", {
      workspaceUid,
      parentUid,
    });

    if (!directories) {
      throw "Unknown failure!";
    }

    return directories;
  } catch (e) {
    console.error("[Directory] Failed to fetch!", e);
  }
};

export const deleteDir = async (uid: string) => {
  try {
    if (
      !(await invoke<Args, boolean>()("delete_dir", {
        uid,
      }))
    ) {
      toast("Failed to delete directory!", "error");
    }

    return;
  } catch (e) {
    console.error("[Directory] Failed to delete!", e);
    toast("Failed to delete directory!", "error");
  }
};

export const updateDir = async (
  uid: string,
  name: string,
  workspaceUid: string,
  path: string,
  parentUid?: string,
) => {
  try {
    const directory = await invoke<Args, Directory | null>()("update_dir", {
      uid,
      name,
      workspaceUid,
      path,
      parentUid,
    });

    if (!directory) {
      toast("Failed to update directory!", "error");
      return;
    }

    return directory;
  } catch (e) {
    console.error("[Directory] Failed to update!", e);
    toast("Failed to update directory!", "error");
  }
};
