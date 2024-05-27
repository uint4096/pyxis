import { invoke as invokeCommand } from "@tauri-apps/api";
import type { File, Entity, Directory } from "../types";

type FileContent = {
  read_status: boolean;
  content: string | null;
};

type DirContent = {
  read_status: boolean;
  entries: Array<Entity> | null;
};

export type Args<T extends object> = {
  read_system_config: never;
  write_system_config: { config: T };
  read_workspace_config: { path: string };
  write_workspace_config: { path: string; config: T };
  read_store_config: { path: string };
  write_store_config: { path: string; config: T };
  read_workspace_tree: { path: string };
  create_file: { file: File; path: string };
  rename_file: { file: File; path: string; new_name: string };
  delete_file: { file: File; path: string };
  create_dir: { dir: Directory; path: string };
  rename_dir: { dir: Directory; path: string; new_name: string };
  delete_dir: { dir: Directory; path: string };
};

export type Response = {
  read_system_config: FileContent;
  write_system_config: boolean;
  read_workspace_config: FileContent;
  write_workspace_config: boolean;
  read_store_config: FileContent;
  write_store_config: boolean;
  read_workspace_tree: DirContent;
  create_file: boolean;
  rename_file: boolean;
  delete_file: boolean;
  create_dir: boolean;
  rename_dir: boolean;
  delete_dir: boolean;
};

export const invoke = async <
  T extends object,
  U extends keyof Args<T> | keyof Response
>(
  command: U,
  args: Args<T>[U]
): Promise<Response[U]> => {
  try {
    const response: Response[U] = await invokeCommand(command, args);
    return response;
  } catch (e) {
    if ((<Error>e)?.message?.match(/window\.__TAURI_IPC__ is not a function/)) {
      console.error("[Invoke error] Running on a browser window!");
    } else {
      console.error("[Invoke Error]", e);
    }

    throw e;
  }
};
