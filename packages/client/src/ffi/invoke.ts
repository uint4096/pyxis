import { invoke as invokeCommand } from "@tauri-apps/api";

export const invoke =
  <T extends Record<string, Record<string, unknown>>, X>() =>
  async <U extends keyof T>(command: U, args: T[U]): Promise<X> => {
    try {
      const response: X = await invokeCommand(<string>command, args);
      return response;
    } catch (e) {
      if (
        (<Error>e)?.message?.match(/window\.__TAURI_IPC__ is not a function/)
      ) {
        console.error("[Invoke error] Running on a browser window!");
      } else {
        console.error("[Invoke Error]", e);
      }

      throw e;
    }
  };
