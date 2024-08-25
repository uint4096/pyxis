import { createFile, updateFile, getFiles, deleteFile } from "../ffi";
import { create, StateCreator } from "zustand";
import { toast } from "../utils";
import { dirSlice } from "./use-directory";
import { File } from "../ffi/files";
import { DirectoryState, DirWithChildren, FileState, Node } from "./types";

const getFilesForDirs = async (
  workspaceUid: string,
  dir: DirWithChildren,
): Promise<Node> => {
  const files = await getFiles(workspaceUid, dir.uid);

  return {
    ...dir,
    children: [
      ...(await Promise.all(
        (dir.children || []).map((d) => getFilesForDirs(workspaceUid, d)),
      )),
      ...files,
    ],
  };
};

type DirectoryLike = { [k: string]: unknown; children: Array<unknown> };
export const isFile = (element: File | DirectoryLike): element is File =>
  !!(element as File).title;

const fileSlice: StateCreator<DirectoryState & FileState, [], [], FileState> = (
  set,
  get,
) => ({
  tree: [],

  createFile: async (title, workspaceUid, path, links, tags, dirUid) => {
    const file = await createFile(
      title,
      workspaceUid,
      path,
      links,
      tags,
      dirUid,
    );
    if (!file) {
      return;
    }

    await get().createTree(workspaceUid);

    return file;
  },

  findNode: (uid: string, tree): Node | undefined =>
    (tree ?? get().tree).reduce<Node | undefined>((acc, node) => {
      if (acc) {
        return acc;
      }

      if (node.uid === uid) {
        return node;
      }

      return isFile(node) ? undefined : get().findNode(uid, node.children);
    }, undefined),

  deleteFile: async (file: File) => {
    if (!file.uid) {
      return;
    }

    await deleteFile(file.uid);

    await get().createTree(file.workspace_uid);
  },

  updateFile: async (file: File) => {
    if (!file.id) {
      return;
    }

    const { uid, title, workspace_uid, path, dir_uid, tags, links } = file;
    await updateFile(uid, title, workspace_uid, path, links, tags, dir_uid);

    await get().createTree(workspace_uid);
  },

  buildTree: async (workspaceUid: string) => {
    const builtDirs = await get().buildDir(workspaceUid);

    return [
      ...(await Promise.all(
        builtDirs.map((dir) => getFilesForDirs(workspaceUid, dir)),
      )),
      ...(await getFiles(workspaceUid)),
    ];
  },

  createTree: async (workspaceUid: string) => {
    try {
      const tree = await get().buildTree(workspaceUid);

      set({ tree });

      return tree;
    } catch (e) {
      toast("Failed to get files!");
      return [];
    }
  },
});

export const useTreeStore = create<DirectoryState & FileState>()((...a) => ({
  ...dirSlice(...a),
  ...fileSlice(...a),
}));
