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
      throw new Error("Empty response!");
      return;
    }

    return workspace;
  } catch (e) {
    console.error("[Workspace] Create failed!", e);
    throw e;
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
    throw e;
  }
};

export const deleteWorkspace = async (uid: string) => {
  try {
    if (
      !(await invoke<Args, boolean>()("delete_workspace", {
        uid,
      }))
    ) {
      throw new Error("Empty response!");
    }

    return true;
  } catch (e) {
    console.error("[Workspace] Failed to delete!", e);
    throw e;
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
    throw e;
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
