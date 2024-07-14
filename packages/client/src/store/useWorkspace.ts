import type { Directory, File } from "../types";
import {
  createFile,
  createDir,
  deleteFile,
  deleteDir,
  saveWorkspaceConfig,
} from "../ffi";
import { create } from "zustand";
import { WorkspaceConfig } from "./types";
import { updateTree } from "./helpers/update-tree";
import { deleteFromTree } from "./helpers/delete-from-tree";
import { isFile } from "../utils/guards";

interface WorkspaceState {
  config: Partial<WorkspaceConfig>;
  path: string | undefined;
  initConfig: (config: WorkspaceConfig, workspacePath: string) => void;
  attachTree: (tree: WorkspaceConfig["tree"]) => Promise<void>;
  addEntity: (entity: File | Directory) => Promise<void>;
  removeEntity: (entity: File | Directory) => Promise<void>;
  saveToDisk: (config: WorkspaceConfig) => Promise<void>;
}

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  config: {},

  path: undefined,

  initConfig: (config, workspacePath) => set({ config, path: workspacePath }),

  saveToDisk: async (config) => {
    await saveWorkspaceConfig<WorkspaceConfig>({
      path: get().path ?? "",
      config,
    });

    set({ config });
  },

  attachTree: async (tree) => {
    const config = { ...get().config, tree };
    await get().saveToDisk(<WorkspaceConfig>config);
    set({ config: { ...get().config, tree } });
  },

  addEntity: async (entity) => {
    const wsConfig = get().config;

    const entityPath = `${get().path ?? ""}/${entity.path}`;

    const response = await (isFile(entity)
      ? createFile({ file: entity, path: entityPath })
      : createDir({ dir: entity, path: entityPath }));

    if (!response) {
      //@todo: Handle error and show toast message
      return;
    }

    const tree = updateTree(wsConfig)(entity);

    await get().attachTree(tree);
  },

  removeEntity: async (entity) => {
    const wsConfig = get().config;

    const entityPath = `${get().path ?? ""}${entity.path}`;

    const response = await (isFile(entity)
      ? deleteFile({ file: entity, path: entityPath })
      : deleteDir({ dir: entity, path: entityPath }));

    if (!response) {
      //@todo: Handle error and show toast message
      return;
    }

    const tree = deleteFromTree(wsConfig)(entity);

    await get().attachTree(tree);
  },
}));
