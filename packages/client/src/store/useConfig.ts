import {
  addUserData,
  removeUserData,
  getConfig,
  type Config,
  ConfigResponse,
} from "../ffi";
import { jwtDecode } from "jwt-decode";
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
  setConfig: (userId: string) => Promise<void>;
}

type DecodedToken = {
  user: Pick<ConfigResponse, "user_id" | "username">;
  exp: number;
};

const decodeToken = (token: string): DecodedToken | null => {
  try {
    return jwtDecode(token);
  } catch (e) {
    console.error("[Auth] Error while decoding token!", e);
    return null;
  }
};

export const useConfig = create<ConfigState>((set, get) => ({
  config: {},

  create: async (username, userId, token, deviceId, features) => {
    await addUserData({
      username,
      userId: userId,
      userToken: token,
      deviceId,
      features,
    });
    get().setConfig(userId);
  },

  delete: async (userId: string) => {
    await removeUserData(userId);
    get().setConfig(userId);
  },

  get: async (userId: string) => {
    return await getConfig(userId);
  },

  setConfig: async (userId: string) => {
    const config = await getConfig(userId);

    if (!config) {
      return;
    }

    if (config.userToken) {
      const decodedToken = decodeToken(config.userToken);
      const currentTime = new Date().getTime();
      if (!decodedToken || decodedToken.exp * 1000 < currentTime) {
        await get().delete(userId);
        return;
      }
    }

    set({
      config,
    });
  },
}));
