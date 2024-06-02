import { invoke, type Args } from "./invoke";

type AssertProperty<T, U extends string, V> = T & { [key in U]: V };
const saveConfig =
  <
    T extends Extract<
      keyof Args<Record<string, unknown>>,
      "write_store_config" | "write_workspace_config" | "write_system_config"
    >,
  >(
    command: T,
  ) =>
  async <U extends object>(args: Args<U>[T]): Promise<boolean> => {
    try {
      if (!(await invoke(command, args))) {
        console.error(`[Config Error] Write failed!`);
        return false;
      }

      return true;
    } catch (e) {
      console.error(
        `[Config Error] Error while writing to ${
          (<AssertProperty<object, "path", string>>args)?.path ??
          "system config"
        }!`,
        e,
      );
      return false;
    }
  };

export const saveSystemConfig = saveConfig("write_system_config");
export const saveStoreConfig = saveConfig("write_store_config");
export const saveWorkspaceConfig = saveConfig("write_workspace_config");
