import { addUserData, removeUserData, getConfig, type Config } from "../ffi";
import { create } from "zustand";

interface ConfigState {
  config: Config;
  create: (
    username: string,
    userId: string,
    token: string,
    deviceId: string,
  ) => Promise<void>;
  delete: () => Promise<void>;
  setConfig: () => Promise<void>;
}

export const useConfig = create<ConfigState>((set, get) => ({
  config: {},

  create: async (username, userId, token, deviceId) => {
    await addUserData({
      username,
      userId: userId,
      userToken: token,
      deviceId,
    });
    get().setConfig();
  },

  delete: async () => {
    await removeUserData();
    get().setConfig();
  },

  setConfig: async () => {
    const config = await getConfig();
    console.info("Config", config);

    if (!config) {
      return;
    }

    set({
      config,
    });
  },
}));
