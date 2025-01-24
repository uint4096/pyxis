import {
  createWorkspace,
  deleteWorkspace,
  getWorkspaces,
  updateWorkspace,
  getByName,
  type Workspace,
} from "../ffi";
import { create } from "zustand";

interface WorkspaceState {
  workspaces: Array<Partial<Workspace>>;
  currentWorkspace: Partial<Workspace>;
  init: (workspaces: Array<Workspace>) => void;
  create: (
    name: string,
    uid?: string,
    createdAt?: string,
    updatedAt?: string,
  ) => Promise<Workspace | undefined>;
  delete: (uid: string) => Promise<void>;
  list: () => Promise<Array<Workspace>>;
  updateSelection: (workspace: Workspace) => Promise<void>;
  isDuplicate: (name: string) => Promise<boolean>;
  updateWorkspace: (uid: string, name: string) => Promise<void>;
}

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  workspaces: [],

  currentWorkspace: {},

  init: (workspaces) =>
    set({
      workspaces,
      currentWorkspace: workspaces.find((w) => w.selected),
    }),

  create: async (name, uid, createdAt, updatedAt) => {
    const workspace = await createWorkspace(
      name,
      true,
      uid,
      createdAt,
      updatedAt,
    );
    const { list } = get();
    await list();

    return workspace;
  },

  delete: async (uid) => {
    const success = await deleteWorkspace(uid);

    if (success) {
      set({
        workspaces: get().workspaces.filter((w) => w.uid !== uid),
        ...(get().currentWorkspace.uid === uid && { currentWorkspace: {} }),
      });
    }
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

  isDuplicate: async (name) => {
    const workspaceId = await getByName(name);
    return !!workspaceId;
  },

  updateWorkspace: async (uid, name) => {
    const currentWorkspace = get().workspaces?.find((w) => w.uid === uid);
    await updateWorkspace(uid, name, !!currentWorkspace?.selected);
  },
}));
