import { invoke } from "./invoke";

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
