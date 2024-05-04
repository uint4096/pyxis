import { invoke, Config } from "./invoke";

export const read_config = async (configPath: string): Promise<string> => {
  try {
    const { content, read_status } = await invoke("read_config", {
      path: configPath,
    });
    if (!read_status) {
      console.error(`[Config Error]! Read failed`);
      return "";
    }

    return content ?? "";
  } catch (e) {
    console.error(`[Config Error]! Error while reading from ${configPath}`, e);
    return "";
  }
};

export const save_config = (configPath: string, config: Config) =>
  invoke("save_config", { path: configPath, content: config });
