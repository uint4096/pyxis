import { toast } from "../utils";
import { invoke } from "./invoke_v2";

export type Workspace = {
  id?: number;
  name: string;
  selected: boolean;
  created_at: string;
  updated_at: string;
};

export type Args = {
  list_workspaces: never;
  create_workspace: { name: string; selected: boolean };
  delete_workspace: { id: number };
  update_workspace: { id: number; name: string; selected: boolean };
};

export const createWorkspace = async (name: string, selected: boolean) => {
  try {
    const workspace = await invoke<Args, Workspace>()("create_workspace", {
      name,
      selected,
    });

    toast("Workspace created!");

    return workspace;
  } catch (e) {
    console.error("[Workspace] Create failed!", e);
    toast("Failed to create workspace!", "error");
  }
};

export const getWorkspaces = async () => {
  try {
    const workspaces = await invoke<Args, Array<Workspace>>()(
      "list_workspaces",
      {} as never,
    );

    return workspaces;
  } catch (e) {
    console.error("[Workspace] Failed to fetch!", e);
    toast("Failed to get workspaces!", "error");
  }
};

export const deleteWorkspace = async (id: number) => {
  try {
    if (
      !(await invoke<Args, boolean>()("delete_workspace", {
        id,
      }))
    ) {
      toast("Failed to delete workspace!", "error");
    }

    return;
  } catch (e) {
    console.error("[Workspace] Failed to delete!", e);
    toast("Failed to delete workspace!", "error");
  }
};

export const updateWorkspace = async (
  id: number,
  name: string,
  selected: boolean,
) => {
  try {
    const workspace = await invoke<Args, boolean>()("update_workspace", {
      id,
      name,
      selected,
    });

    if (!workspace) {
      toast("Failed to update workspace!", "error");
    }

    return workspace;
  } catch (e) {
    console.error("[Workspace] Failed to update!", e);
    toast("Failed to update workspace!", "error");
  }
};
