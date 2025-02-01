import {
  addUserData,
  removeUserData,
  getConfig,
  type Config,
  getLoggedInUser,
  getDeviceId,
} from "../ffi";
import { create } from "zustand";

interface ConfigState {
  config: Config;
  create: (
    username: string,
    userId: string,
    token: string,
    deviceId: string,
    features?: Record<string, string>,
  ) => Promise<void>;
  get: (userId: string) => Promise<Config | undefined>;
  delete: (userId: string) => Promise<void>;
  setConfig: (config: Config) => Promise<void>;
  getLoggedInUser: () => Promise<Config | undefined>;
  getDeviceId: () => Promise<string>;
}

export const useConfig = create<ConfigState>((set, get) => ({
  config: {},

  create: async (username, userId, token, deviceId, features) => {
    const config = {
      username,
      userId: userId,
      userToken: token,
      deviceId,
      features,
    };

    await addUserData(config);
    get().setConfig(config);
  },

  delete: async (userId: string) => {
    await removeUserData(userId);

    const config = { userId };
    get().setConfig(config);
  },

  get: async (userId: string) => {
    return await getConfig(userId);
  },

  getLoggedInUser: async () => {
    return await getLoggedInUser();
  },

  setConfig: async (config: Config) => {
    if (!config) {
      return;
    }

    set({
      config,
    });
  },

  getDeviceId: async () => getDeviceId(),
}));
