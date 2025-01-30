import { createDir, updateDir, getDirs, deleteDir, getByPath } from "../ffi";
import type { StateCreator } from "zustand";
import type { DirectoryState, DirWithChildren, FileState } from "./types";

export const dirSlice: StateCreator<
  DirectoryState & FileState,
  [],
  [],
  DirectoryState
> = (_, get) => ({
  createDir: async (
    name,
    workspaceUid,
    path,
    parentUid,
    uid,
    createdAt,
    updatedAt,
    synced,
  ) => {
    const dirs = await createDir(
      name,
      workspaceUid,
      path,
      parentUid,
      uid,
      createdAt,
      updatedAt,
      synced,
    );
    if (!dirs) {
      return;
    }

    await get().createTree(workspaceUid);

    return dirs;
  },

  buildDir: async (workspaceUid, parentUid) => {
    const dirs = await getDirs(workspaceUid, parentUid);

    if (!dirs) {
      return [];
    }

    return await Promise.all([
      ...dirs.map(async (dir) => {
        const children = await get().buildDir(dir.workspace_uid, dir.uid);
        return {
          ...dir,
          children,
        };
      }),
    ]);
  },

  deleteDir: async (directory: DirWithChildren) => {
    if (!directory.uid) {
      return;
    }

    await deleteDir(directory.uid);
    await get().createTree(directory.workspace_uid);
  },

  updateDir: async (directory: DirWithChildren, synced) => {
    if (!directory.id) {
      return;
    }

    const { uid, name, workspace_uid, path, parent_uid } = directory;
    await updateDir(uid, name, workspace_uid, path, parent_uid, synced);

    await get().createTree(directory.workspace_uid);
  },

  isDuplicateDirectory: async (path, workspaceUid) => {
    const directoryId = await getByPath(path, workspaceUid);
    return !!directoryId;
  },
});
