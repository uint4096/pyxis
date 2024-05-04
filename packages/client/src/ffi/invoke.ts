import { invoke as invokeCommand } from "@tauri-apps/api";

export type Config = {
  [k: string]: Config | boolean | number | string | null;
};

type FileContent = {
  read_status: boolean;
  content: string | null;
};

type Args = {
  read_config: { path: string };
  save_config: { path: string; content: Config };
};

type Response = {
  read_config: FileContent;
  save_config: boolean;
};

export const invoke = async <T extends keyof Args | keyof Response>(
  command: T,
  args: Args[T]
): Promise<Response[T]> => {
  try {
    const response: Response[T] = await invokeCommand(command, args);
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
