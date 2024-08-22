import { toast } from "../utils";
import { invoke } from "./invoke_v2";

export type Directory = {
  id?: number;
  name: string;
  path: string;
  workspace_id: number;
  parent_id?: number;
  created_at: string;
  updated_at: string;
};

type Args = {
  list_dirs: { workspaceId: number; parentId?: number };
  create_dir: {
    name: string;
    workspaceId: number;
    path: string;
    parentId?: number;
  };
  delete_dir: { id: number };
  update_dir: {
    id: number;
    name: string;
    workspaceId: number;
    path: string;
    parentId?: number;
  };
};

export const createDir = async (
  name: string,
  workspaceId: number,
  path: string,
  parentId?: number,
) => {
  try {
    const directory = await invoke<Args, Directory | null>()("create_dir", {
      name,
      path,
      workspaceId,
      parentId,
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

export const getDirs = async (workspaceId: number, parentId?: number) => {
  try {
    const directories = await invoke<Args, Array<Directory>>()("list_dirs", {
      workspaceId,
      parentId,
    });

    return directories;
  } catch (e) {
    console.error("[Directory] Failed to fetch!", e);
  }
};

export const deleteDir = async (id: number) => {
  try {
    if (
      !(await invoke<Args, boolean>()("delete_dir", {
        id,
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
  id: number,
  name: string,
  workspaceId: number,
  path: string,
  parentId?: number,
) => {
  try {
    const directory = await invoke<Args, Directory | null>()("update_dir", {
      id,
      name,
      workspaceId,
      path,
      parentId,
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
