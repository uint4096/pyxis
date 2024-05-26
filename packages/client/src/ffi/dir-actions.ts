import { Args, invoke } from "./invoke";

const invokeDirAction =
  <
    T extends Extract<
      keyof Args<never>,
      "create_dir" | "rename_dir" | "delete_dir"
    >
  >(
    command: T
  ) =>
  async (args: Args<never>[T]) => {
    try {
      if (!(await invoke(command, args))) {
        console.error(`[Dir Action] ${command} failed!`);
        return false;
      }

      return true;
    } catch (e) {
      console.error(`[Dir Action] Error while running ${command}!`, e);
      return false;
    }
  };

export const createDir = invokeDirAction("create_dir");
export const renameDir = invokeDirAction("rename_dir");
export const deleteDir = invokeDirAction("delete_dir");
