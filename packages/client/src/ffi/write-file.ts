import { File } from "../types";
import { invoke } from "./invoke";

export const createFile = async (file: File, path: string) => {
  try {
    if (!(await invoke("create_file", { file, path }))) {
      console.error(`[Config Error] Create failed!`);
      return false;
    }

    return true;
  } catch (e) {
    console.error(
      `[Config Error] Error while creating ${file} within ${path}!`,
      e
    );
    return false;
  }
};
