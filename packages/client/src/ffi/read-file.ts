import { parse } from "../utils";
import { invoke, type Args } from "./invoke";

type ReadOptions = {
  parseAsJson?: boolean;
};

const readFile =
  <
    T extends Extract<
      keyof Args<never>,
      | "read_store_config"
      | "read_workspace_config"
      | "read_system_config"
      | "read_file"
    >,
  >(
    command: T,
    { parseAsJson = true }: ReadOptions = {},
  ) =>
  async <U extends object | string>(
    args: Args<never>[T],
  ): Promise<U | null> => {
    try {
      const { read_status, content } = await invoke(command, args);
      if (!read_status) {
        console.error(`[Config Error] Read failed or no config!`);
        return null;
      }

      return parseAsJson ? parse<U>(content ?? "") : <U>content ?? "";
    } catch (e) {
      console.error(
        `[Config Error] Error while reading from ${args.path ?? "system"}!`,
        e,
      );
      return null;
    }
  };

export const readStoreConfig = readFile("read_store_config");
export const readWorkspaceConfig = readFile("read_workspace_config");
export const readSystemConfig = readFile("read_system_config");
export const readFileContent = readFile("read_file", { parseAsJson: false });
