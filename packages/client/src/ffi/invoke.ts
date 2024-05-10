import { invoke as invokeCommand } from "@tauri-apps/api";

type FileContent = {
  read_status: boolean;
  content: string | null;
};

export type Args<T extends object> = {
  read_system_config: never;
  write_system_config: { config: T };
  read_workspace_config: { path: string };
  write_workspace_config: { path: string; config: T };
  read_store_config: { path: string };
  write_store_config: { path: string; config: T };
};

export type Response = {
  read_system_config: FileContent;
  write_system_config: boolean;
  read_workspace_config: FileContent;
  write_workspace_config: boolean;
  read_store_config: FileContent;
  write_store_config: boolean;
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
