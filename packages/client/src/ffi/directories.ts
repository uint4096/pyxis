import { toast } from "../utils";
import { invoke } from "./invoke";

export type Directory = {
  id?: number;
  uid: string;
  name: string;
  path: string;
  workspace_uid: string;
  parent_uid?: string;
  created_at: string;
  updated_at: string;
  synced?: boolean;
};

type Args = {
  list_dirs: { workspaceUid: string; parentUid?: string };
  get_directory_id: { workspaceUid: string; path: string };
  create_dir: {
    name: string;
    workspaceUid: string;
    path: string;
    parentUid?: string;
    uid?: string;
    created_at?: string;
    updated_at?: string;
    synced?: boolean;
  };
  delete_dir: { uid: string };
  update_dir: {
    uid: string;
    name: string;
    workspaceUid: string;
    path: string;
    parentUid?: string;
    synced?: boolean;
  };
};

export const createDir = async (
  name: string,
  workspaceUid: string,
  path: string,
  parentUid?: string,
  uid?: string,
  createdAt?: string,
  updatedAt?: string,
  synced?: boolean,
) => {
  try {
    const directory = await invoke<Args, Directory | null>()("create_dir", {
      name,
      path,
      workspaceUid,
      parentUid,
      uid,
      created_at: createdAt,
      updated_at: updatedAt,
      synced,
    });

    if (!directory) {
      toast("Failed to create directory!");
      return;
    }

    return directory;
  } catch (e) {
    console.error("[Directory] Create failed!", e);
    toast("Failed to create directory!");
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
      toast("Failed to delete directory!");
    }

    return;
  } catch (e) {
    console.error("[Directory] Failed to delete!", e);
    toast("Failed to delete directory!");
  }
};

export const getByPath = async (path: string, workspaceUid: string) => {
  try {
    return await invoke<Args, number | undefined>()("get_directory_id", {
      workspaceUid,
      path,
    });
  } catch (e) {
    console.error("[Directory] Failed to fetch by path!", e);
  }
};

export const updateDir = async (
  uid: string,
  name: string,
  workspaceUid: string,
  path: string,
  parentUid?: string,
  synced?: boolean,
) => {
  try {
    const directory = await invoke<Args, Directory | null>()("update_dir", {
      uid,
      name,
      workspaceUid,
      path,
      parentUid,
      synced,
    });

    if (!directory) {
      toast("Failed to update directory!");
      return;
    }

    return directory;
  } catch (e) {
    console.error("[Directory] Failed to update!", e);
    toast("Failed to update directory!");
  }
};
