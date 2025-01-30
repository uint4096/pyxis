import { toast } from "../utils";
import { invoke } from "./invoke";

export type Workspace = {
  id?: number;
  uid: string;
  name: string;
  selected: boolean;
  created_at: string;
  updated_at: string;
  synced?: boolean;
};

type Args = {
  list_workspaces: never;
  create_workspace: {
    name: string;
    selected: boolean;
    uid?: string;
    created_at?: string;
    updated_at?: string;
    synced?: boolean;
  };
  delete_workspace: { uid: string };
  update_workspace: {
    uid: string;
    name: string;
    selected: boolean;
    synced?: boolean;
  };
  get_workspace_id: { name: string };
};

export const createWorkspace = async (
  name: string,
  selected: boolean,
  uid?: string,
  createdAt?: string,
  updatedAt?: string,
  synced?: boolean,
) => {
  try {
    const workspace = await invoke<Args, Workspace>()("create_workspace", {
      name,
      selected,
      uid,
      created_at: createdAt,
      updated_at: updatedAt,
      synced,
    });

    if (!workspace) {
      toast("Failed to create workspace!");
      return;
    }

    return workspace;
  } catch (e) {
    console.error("[Workspace] Create failed!", e);
    toast("Failed to create workspace!");
  }
};

export const getWorkspaces = async () => {
  try {
    const workspaces = await invoke<Args, Array<Workspace>>()(
      "list_workspaces",
      {} as never,
    );

    if (!workspaces) {
      throw "Unknown failure!";
    }

    return workspaces;
  } catch (e) {
    console.error("[Workspace] Failed to fetch!", e);
    toast("Failed to get workspaces!");
  }
};

export const deleteWorkspace = async (uid: string) => {
  try {
    if (
      !(await invoke<Args, boolean>()("delete_workspace", {
        uid,
      }))
    ) {
      toast("Failed to delete workspace!");
      return false;
    }

    return true;
  } catch (e) {
    console.error("[Workspace] Failed to delete!", e);
    toast("Failed to delete workspace!");
  }
};

export const updateWorkspace = async (
  uid: string,
  name: string,
  selected: boolean,
  synced?: boolean,
) => {
  try {
    return await invoke<Args, void>()("update_workspace", {
      uid,
      name,
      selected,
      synced,
    });
  } catch (e) {
    console.error("[Workspace] Failed to update!", e);
    toast("Failed to update workspace!");
  }
};

export const getByName = async (name: string) => {
  try {
    return await invoke<Args, number>()("get_workspace_id", {
      name,
    });
  } catch (e) {
    console.error("[Workspace] Failed to get by name!", e);
  }
};
