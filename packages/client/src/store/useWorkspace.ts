import {
  createWorkspace,
  deleteWorkspace,
  getWorkspaces,
  updateWorkspace,
  type Workspace,
} from "../ffi";
import { create } from "zustand";

interface WorkspaceState {
  workspaces: Array<Partial<Workspace>>;
  currentWorkspace: Partial<Workspace>;
  init: (workspaces: Array<Workspace>) => void;
  create: (name: string) => Promise<Workspace | undefined>;
  delete: (uid: string) => Promise<void>;
  list: () => Promise<Array<Workspace>>;
  updateSelection: (workspace: Workspace) => Promise<void>;
}

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  workspaces: [],

  currentWorkspace: {},

  init: (workspaces) =>
    set({
      workspaces,
      currentWorkspace: workspaces.find((w) => w.selected),
    }),

  create: async (name) => {
    const workspace = await createWorkspace(name, true);
    const { list } = get();
    await list();

    return workspace;
  },

  delete: async (uid) => {
    await deleteWorkspace(uid);

    set({
      workspaces: get().workspaces.filter((w) => w.uid !== uid),
    });
  },

  list: async () => {
    const workspaces = await getWorkspaces();

    if (!workspaces) {
      return [];
    }

    set({
      workspaces,
      currentWorkspace: workspaces.find((w) => w.selected),
    });

    return workspaces as Array<Workspace>;
  },

  updateSelection: async (workspace) => {
    if (!workspace.uid) {
      return;
    }

    await updateWorkspace(workspace.uid, workspace.name, true);
    const { list } = get();
    await list();
  },
}));
