import type { Directory, Link, File, Snapshot } from "../ffi";

export type ArrayElement<T> = T extends Array<infer X> ? X : never;

export type DirWithChildren = Directory & { children: Array<DirWithChildren> };

export interface DirectoryState {
  isDuplicateDirectory: (
    path: string,
    workspaceUid: string,
  ) => Promise<boolean>;
  createDir: (
    name: string,
    workspaceUid: string,
    path: string,
    parentUid?: string,
    uid?: string,
    createdAt?: string,
    updatedAt?: string,
  ) => Promise<Directory | undefined>;
  buildDir: (
    workspaceUid: string,
    parentUid?: string,
  ) => Promise<Array<DirWithChildren>>;
  deleteDir: (directory: DirWithChildren) => Promise<void>;
  updateDir: (directory: DirWithChildren) => Promise<void>;
}

export type Node = File | (Directory & { children: Array<Node> });

export type Document = "file" | "dir";

export type FileContent = {
  snapshot: Snapshot | undefined;
  updates: Array<Uint8Array>;
};

export interface FileState {
  tree: Array<Node>;
  selectedFile: File | undefined;
  selectFile: (file: File | undefined) => void;
  findNode: (uid: string, tree?: Array<Node>) => Node | undefined;
  isDuplicateFile: (path: string, workspaceUid: string) => Promise<boolean>;
  createFile: (
    title: string,
    workspaceUid: string,
    path: string,
    links: Array<Link>,
    tags: Array<string>,
    dirUid?: string,
    uid?: string,
    createdAt?: string,
    updatedAt?: string,
  ) => Promise<File | undefined>;

  deleteFile: (file: File) => Promise<void>;

  updateFile: (file: File) => Promise<void>;

  buildTree: (workspaceId: string) => Promise<Array<Node>>;
  createTree: (workspaceId: string) => Promise<Array<Node>>;
  updateSnapshots: (fileUid: string, content: Uint8Array) => Promise<void>;
  insertUpdates: (
    fileUid: string,
    snapshotId: number,
    content: Uint8Array,
  ) => Promise<void>;
  getContent: (fileUid: string) => Promise<FileContent>;
  isFileInDir: (fileUid: string, dir: DirWithChildren) => boolean;
}
