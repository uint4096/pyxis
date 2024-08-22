import { createDir, updateDir, getDirs, deleteDir, Directory } from "../ffi";
import { create } from "zustand";
import { toast } from "../utils";

export type DirWithChildren = Directory & { children: Array<DirWithChildren> };

interface DirectoryState {
  directories: Array<DirWithChildren>;
  create: (
    name: string,
    workspaceId: number,
    path: string,
    parentId?: number,
  ) => Promise<Directory | undefined>;
  find: (id: number) => DirWithChildren | undefined;
  build: (
    workspaceId: number,
    parentId?: number,
  ) => Promise<Array<DirWithChildren>>;
  list: (workspaceId: number, parentId?: number) => Promise<Array<Directory>>;
  delete: (directory: DirWithChildren) => Promise<void>;
  update: (directory: DirWithChildren) => Promise<void>;
}

const findDir = (
  directories: Array<DirWithChildren>,
  id: number,
): DirWithChildren | undefined => {
  return directories.find((directory) => {
    if (directory.id === id) {
      return true;
    }

    return findDir(directory.children, id);
  });
};

export const useDirectory = create<DirectoryState>((set, get) => ({
  directories: [],
  find: (id: number): DirWithChildren | undefined =>
    get().directories.find((directory) => {
      if (directory.id === id) {
        return true;
      }

      return findDir(directory.children, id);
    }),

  create: async (name, workspaceId, path, parentId) => {
    const dirs = await createDir(name, workspaceId, path, parentId);
    if (!dirs) {
      return;
    }

    const { list } = get();
    await list(workspaceId);

    return dirs;
  },

  build: async (workspaceId, parentId) => {
    const dirs = await getDirs(workspaceId, parentId);

    if (!dirs) {
      return [];
    }

    const { build } = get();

    return await Promise.all([
      ...dirs.map(async (dir) => {
        const children = await build(dir.workspace_id, dir.id);
        return {
          ...dir,
          children,
        };
      }),
    ]);
  },

  list: async (workspaceId) => {
    const { build } = get();

    try {
      const dirs = await build(workspaceId);
      set({
        directories: dirs,
      });

      return dirs;
    } catch (e) {
      toast("Failed to get directories!", "error");
      return [];
    }
  },

  delete: async (directory: DirWithChildren) => {
    if (!directory.id) {
      return;
    }

    await deleteDir(directory.id);

    const { list } = get();
    await list(directory.workspace_id);
  },

  update: async (directory: DirWithChildren) => {
    if (!directory.id) {
      return;
    }

    const { id, name, workspace_id, path, parent_id } = directory;
    await updateDir(id, name, workspace_id, path, parent_id);

    const { list } = get();
    await list(directory.workspace_id);
  },
}));
