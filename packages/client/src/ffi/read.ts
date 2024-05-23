import { isFile } from "../pages/explorer/guards";
import { parse } from "../utils";
import { invoke, type Args } from "./invoke";

const readConfig =
  <
    T extends Extract<
      keyof Args<never>,
      "read_store_config" | "read_workspace_config" | "read_system_config"
    >
  >(
    command: T
  ) =>
  async <U extends object>(args: Args<never>[T]): Promise<U | null> => {
    try {
      const { read_status, content } = await invoke(command, args);
      if (!read_status || !content) {
        console.error(`[Config Error] Read failed or no config!`);
        return null;
      }

      return parse<U>(content);
    } catch (e) {
      console.error(
        `[Config Error] Error while reading from ${args.path ?? "system"}!`,
        e
      );
      return null;
    }
  };

export const readStoreConfig = readConfig("read_store_config");
export const readWorkspaceConfig = readConfig("read_workspace_config");
export const readSystemConfig = readConfig("read_system_config");

export const read_dir_tree = async (path: string) => {
  try {
    const { read_status, entries } = await invoke("read_workspace_tree", {
      path,
    });
    if (!read_status) {
      console.error(`[Config Error] Failed to read workspace directory!`);
      return [];
    }

    return entries;
  } catch (e) {
    console.error(`[Config Error] Error while reading workspace tree!`, e);
    return [];
  }
};
