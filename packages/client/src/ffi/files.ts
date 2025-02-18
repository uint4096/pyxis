import { invoke } from "./invoke";

export type Link = {
  title: string;
  url: string;
};

export type File = {
  id?: number;
  uid: string;
  dir_uid?: string;
  title: string;
  path: string;
  workspace_uid: string;
  created_at: string;
  updated_at: string;
  tags: Array<string>;
  links: Array<Link>;
  synced?: boolean;
};

type Args = {
  list_files: { dirUid?: string; workspaceUid: string };
  create_file: {
    title: string;
    workspaceUid: string;
    path: string;
    dirUid?: string;
    links: Array<Link>;
    tags: Array<string>;
    uid?: string;
    created_at?: string;
    updated_at?: string;
    synced?: boolean;
  };
  get_file_id: {
    path: string;
    workspaceUid: string;
  };
  delete_file: { uid: string };
  update_file: {
    uid: string;
    title: string;
    dirUid?: string;
    workspaceUid: string;
    path: string;
    links: Array<Link>;
    tags: Array<string>;
    synced?: boolean;
  };
};

export const createFile = async (
  title: string,
  workspaceUid: string,
  path: string,
  links: Array<Link>,
  tags: Array<string>,
  dirUid?: string,
  uid?: string,
  createdAt?: string,
  updatedAt?: string,
  synced?: boolean,
) => {
  try {
    const file = await invoke<Args, File | null>()("create_file", {
      title,
      path,
      workspaceUid,
      links,
      tags,
      dirUid,
      uid,
      created_at: createdAt,
      updated_at: updatedAt,
      synced,
    });

    if (!file) {
      return;
    }

    return file;
  } catch (e) {
    console.error("[File] Create failed!", e);
  }
};

export const getFiles = async (workspaceUid: string, dirUid?: string) => {
  try {
    const files = await invoke<Args, Array<File>>()("list_files", {
      workspaceUid,
      dirUid,
    });

    if (!files) {
      throw "Unknown failure!";
    }

    return files;
  } catch (e) {
    console.error("[File] Failed to fetch!", e);
    throw e;
  }
};

export const getFileByPath = async (path: string, workspaceUid: string) => {
  try {
    return await invoke<Args, number | undefined>()("get_file_id", {
      workspaceUid,
      path,
    });
  } catch (e) {
    console.error("[File] Failed to fetch by path!", e);
  }
};

export const deleteFile = async (uid: string) => {
  try {
    if (
      !(await invoke<Args, boolean>()("delete_file", {
        uid,
      }))
    ) {
      throw new Error("Empty Response!");
    }

    return;
  } catch (e) {
    console.error("[File] Failed to delete!", e);
    throw e;
  }
};

export const updateFile = async (
  uid: string,
  title: string,
  workspaceUid: string,
  path: string,
  links: Array<Link>,
  tags: Array<string>,
  dirUid?: string,
  synced?: boolean,
) => {
  try {
    const file = await invoke<Args, File | null>()("update_file", {
      uid,
      title,
      workspaceUid,
      path,
      dirUid,
      tags,
      links,
      synced,
    });

    if (!file) {
      throw new Error("Empty Response!");
    }

    return file;
  } catch (e) {
    console.error("[File] Failed to update!", e);
    throw e;
  }
};
