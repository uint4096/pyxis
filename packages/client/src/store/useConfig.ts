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
  ) => Promise<void>;
  delete: () => Promise<void>;
  setConfig: () => Promise<void>;
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

    if (config.userToken) {
      const decodedToken = decodeToken(config.userToken);
      const currentTime = new Date().getTime();
      if (!decodedToken || decodedToken.exp * 1000 < currentTime) {
        await get().delete();
        return;
      }
    }

    set({
      config,
    });
  },
}));
