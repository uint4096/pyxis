import { Directory, Link, File } from "../ffi";

export type ArrayElement<T> = T extends Array<infer X> ? X : never;

export type DirWithChildren = Directory & { children: Array<DirWithChildren> };

export interface DirectoryState {
  createDir: (
    name: string,
    workspaceUid: string,
    path: string,
    parentUid?: string,
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

export interface FileState {
  tree: Array<Node>;
  findNode: (uid: string, tree?: Array<Node>) => Node | undefined;
  createFile: (
    title: string,
    workspaceUid: string,
    path: string,
    links: Array<Link>,
    tags: Array<string>,
    dirUid?: string,
  ) => Promise<File | undefined>;

  deleteFile: (file: File) => Promise<void>;

  updateFile: (file: File) => Promise<void>;

  buildTree: (workspaceId: string) => Promise<Array<Node>>;
  createTree: (workspaceId: string) => Promise<Array<Node>>;
}
