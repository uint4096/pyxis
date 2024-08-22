import { createDir, updateDir, getDirs, deleteDir, Directory } from "../ffi";
import { create } from "zustand";
import { toast } from "../utils";

export type DirWithChildren = Directory & { children: Array<DirWithChildren> };

interface DirectoryState {
  directories: Array<DirWithChildren>;
  create: (
    name: string,
    workspaceUid: string,
    path: string,
    parentUid?: string,
  ) => Promise<Directory | undefined>;
  find: (uid: string) => DirWithChildren | undefined;
  build: (
    workspaceUid: string,
    parentUid?: string,
  ) => Promise<Array<DirWithChildren>>;
  list: (workspaceUid: string, parentUid?: string) => Promise<Array<Directory>>;
  delete: (directory: DirWithChildren) => Promise<void>;
  update: (directory: DirWithChildren) => Promise<void>;
}

const findDir = (
  directories: Array<DirWithChildren>,
  uid: string,
): DirWithChildren | undefined => {
  return directories.find((directory) => {
    if (directory.uid === uid) {
      return true;
    }

    return findDir(directory.children, uid);
  });
};

export const useDirectory = create<DirectoryState>((set, get) => ({
  directories: [],
  find: (uid: string): DirWithChildren | undefined =>
    get().directories.find((directory) => {
      if (directory.uid === uid) {
        return true;
      }

      return findDir(directory.children, uid);
    }),

  create: async (name, workspaceUid, path, parentUid) => {
    const dirs = await createDir(name, workspaceUid, path, parentUid);
    if (!dirs) {
      return;
    }

    const { list } = get();
    await list(workspaceUid);

    return dirs;
  },

  build: async (workspaceUid, parentUid) => {
    const dirs = await getDirs(workspaceUid, parentUid);

    if (!dirs) {
      return [];
    }

    const { build } = get();

    return await Promise.all([
      ...dirs.map(async (dir) => {
        const children = await build(dir.workspace_uid, dir.uid);
        return {
          ...dir,
          children,
        };
      }),
    ]);
  },

  list: async (workspaceUid) => {
    const { build } = get();

    try {
      const dirs = await build(workspaceUid);
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
    if (!directory.uid) {
      return;
    }

    await deleteDir(directory.uid);

    const { list } = get();
    await list(directory.workspace_uid);
  },

  update: async (directory: DirWithChildren) => {
    if (!directory.id) {
      return;
    }

    const { uid, name, workspace_uid, path, parent_uid } = directory;
    await updateDir(uid, name, workspace_uid, path, parent_uid);

    const { list } = get();
    await list(directory.workspace_uid);
  },
}));
