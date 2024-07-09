import type { Directory, File } from "../../../types";
import { createFile, createDir, deleteFile, deleteDir } from "../../../ffi";
import { create } from "zustand";
import { WorkspaceConfig } from "../types";
import { updateTree } from "./reducers/utils/update-tree";
import { deleteFromTree } from "./reducers/utils/delete-from-tree";
import { isFile } from "../../tree/guards";

interface WorkspaceState {
  config: Partial<WorkspaceConfig>;
  initConfig: (config: WorkspaceConfig) => void;
  attachTree: (tree: WorkspaceConfig["tree"]) => void;
  addEntity: (entity: File | Directory) => Promise<void>;
  removeEntity: (entity: File | Directory) => Promise<void>;
}

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  config: {},
  initConfig: (config: WorkspaceConfig) => set({ config }),

  attachTree: (tree: WorkspaceConfig["tree"]) =>
    set({ config: { ...get().config, tree } }),

  addEntity: async (entity: File | Directory) => {
    const wsConfig = get().config;

    const response = await (isFile(entity)
      ? createFile({ file: entity, path: entity.path })
      : createDir({ dir: entity, path: entity.path }));

    if (!response) {
      //@todo: Handle error and show toast message
      return;
    }

    const tree = updateTree(wsConfig)(entity);

    get().attachTree(tree);
  },

  removeEntity: async (entity: File | Directory) => {
    const wsConfig = get().config;

    const response = await (isFile(entity)
      ? deleteFile({ file: entity, path: entity.path })
      : deleteDir({ dir: entity, path: entity.path }));

    if (!response) {
      //@todo: Handle error and show toast message
      return;
    }

    const tree = deleteFromTree(wsConfig)(entity);

    get().attachTree(tree);
  },
}));
