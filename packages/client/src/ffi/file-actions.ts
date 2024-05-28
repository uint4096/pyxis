import { Args, invoke } from "./invoke";

const invokeFileAction =
  <
    T extends Extract<
      keyof Args<never>,
      "create_file" | "rename_file" | "delete_file"
    >
  >(
    command: T
  ) =>
  async (args: Args<never>[T]) => {
    try {
      if (!(await invoke(command, args))) {
        console.error(`[File Action] ${command} failed!`);
        return false;
      }

      return true;
    } catch (e) {
      console.error(`[File Action] Error while running ${command}!`, e);
      return false;
    }
  };

export const createFile = invokeFileAction("create_file");
export const renameFile = invokeFileAction("rename_file");
export const deleteFile = invokeFileAction("delete_file");
