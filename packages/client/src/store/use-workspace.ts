import {
  createWorkspace,
  deleteWorkspace,
  getWorkspaces,
  updateWorkspace,
  Workspace,
} from "../ffi";
import { create } from "zustand";

interface WorkspaceState {
  workspaces: Array<Partial<Workspace>>;
  current_workspace: Partial<Workspace>;
  init: (workspaces: Array<Workspace>) => void;
  create: (name: string) => Promise<Workspace | undefined>;
  delete: (id: number) => Promise<void>;
  list: () => Promise<Array<Workspace>>;
  updateSelection: (workspace: Workspace) => Promise<void>;
}

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  workspaces: [],

  current_workspace: {},

  init: (workspaces) =>
    set({
      workspaces,
      current_workspace: workspaces.find((w) => w.selected),
    }),

  create: async (name) => {
    const workspace = await createWorkspace(name, true);
    const { list } = get();
    await list();

    return workspace;
  },

  delete: async (id) => {
    await deleteWorkspace(id);

    set({
      workspaces: get().workspaces.filter((w) => w.id !== id),
    });
  },

  list: async () => {
    const workspaces = await getWorkspaces();

    if (!workspaces) {
      return [];
    }

    set({
      workspaces,
      current_workspace: workspaces.find((w) => w.selected),
    });

    return workspaces as Array<Workspace>;
  },

  updateSelection: async (workspace) => {
    if (!workspace.id) {
      return;
    }

    await updateWorkspace(workspace.id, workspace.name, true);
    const { list } = get();
    await list();
  },
}));
