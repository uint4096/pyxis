import {
  type File,
  createFile,
  updateFile,
  getFiles,
  deleteFile,
  updateSnapshot,
  getSnapshot,
  insertUpdates,
  getUpdates,
  getByPath,
} from "../ffi";
import type { StateCreator } from "zustand";
import { toast } from "../utils";
import type { DirectoryState, DirWithChildren, FileState, Node } from "./types";

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

export const fileSlice: StateCreator<
  DirectoryState & FileState,
  [],
  [],
  FileState
> = (set, get) => ({
  tree: [],

  selectedFile: undefined,
  formattedContent: undefined,
  doc: { snapshot: undefined, updates: [] },

  isDuplicateFile: async (path, workspaceUid) => {
    const fileId = await getByPath(path, workspaceUid);
    return !!fileId;
  },

  setFormattedContent: (content) => {
    set({
      formattedContent: content,
    });
  },

  selectFile: async (file) => {
    if (!file?.uid) {
      set({
        selectedFile: undefined,
        formattedContent: undefined,
      });

      return;
    }

    set({
      selectedFile: file,
    });
  },

  createFile: async (
    title,
    workspaceUid,
    path,
    links,
    tags,
    dirUid,
    uid?: string,
    createdAt?: string,
    updatedAt?: string,
    synced?: boolean,
  ) => {
    const file = await createFile(
      title,
      workspaceUid,
      path,
      links,
      tags,
      dirUid,
      uid,
      createdAt,
      updatedAt,
      synced,
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

  updateFile: async (file: File, synced) => {
    if (!file.id) {
      return;
    }

    const { uid, title, workspace_uid, path, dir_uid, tags, links } = file;
    await updateFile(
      uid,
      title,
      workspace_uid,
      path,
      links,
      tags,
      dir_uid,
      synced,
    );

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

  updateSnapshots: async (
    fileUid: string,
    content: Uint8Array = new Uint8Array(),
  ) => await updateSnapshot(fileUid, content),

  insertUpdates: async (
    fileUid: string,
    snapshotId: number,
    content: Uint8Array = new Uint8Array(),
  ) => await insertUpdates(fileUid, snapshotId, content),

  getContent: async (fileUid: string) => {
    const snapshot = await getSnapshot(fileUid);
    const snapshotId = snapshot?.snapshot_id ?? 1;
    const updates = await getUpdates(fileUid, snapshotId);

    return {
      snapshot: snapshot,
      updates: updates ?? [],
    };
  },

  isFileInDir: (fileUid: string, dir: DirWithChildren) =>
    dir.children.some((child) => isFile(child) && child.uid === fileUid) ||
    dir.children.some(
      (child) => !isFile(child) && get().isFileInDir(fileUid, child),
    ),
});
