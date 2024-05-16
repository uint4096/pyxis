import { parse } from "../utils";
import { invoke, type Args } from "./invoke";

type AssertProperty<T, U extends string, V> = T & { [key in U]: V };

const read_config =
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

export const read_store_config = read_config("read_store_config");
export const read_workspace_config = read_config("read_workspace_config");
export const read_system_config = read_config("read_system_config");

//@todo: Refactor the same way read_* was above
export const save_config = async <
  T extends object,
  U extends Extract<
    keyof Args<T>,
    "write_store_config" | "write_workspace_config" | "write_system_config"
  >
>(
  command: U,
  args: Args<T>[U]
): Promise<boolean> => {
  try {
    if (!(await invoke(command, args))) {
      console.error(`[Config Error] Write failed!`);
      return false;
    }

    return true;
  } catch (e) {
    console.error(
      `[Config Error] Error while writing to ${
        (<AssertProperty<{}, "path", string>>args)?.path ?? "system config"
      }!`,
      e
    );
    return false;
  }
};
