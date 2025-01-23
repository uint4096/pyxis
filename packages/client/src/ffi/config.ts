import { invoke } from "./invoke";

export type ConfigResponse = {
  device_id?: string;
  user_id?: string;
  username?: string;
  user_token?: string;
  features?: Record<string, string>;
};

export type Config = {
  deviceId?: string;
  userId?: string;
  username?: string;
  userToken?: string;
  features?: Record<string, string>;
};

export type ConfigRecord = {
  id?: number;
  config?: Config;
};

type Args = {
  add_user_data: Config;
  remove_user_data: { userId: string };
  get_config: { userId: string };
  get_logged_in_user: never;
};

export const addUserData = async (payload: Config) => {
  try {
    const res = await invoke<Args, boolean>()("add_user_data", payload);

    if (!res) {
      return;
    }

    return res;
  } catch (e) {
    console.error("[Configuration] Failed to add config to store!", e);
  }
};

export const removeUserData = async (userId: string) => {
  try {
    const res = await invoke<Args, boolean>()("remove_user_data", { userId });

    if (!res) {
      throw "Unknown failure!";
    }

    return res;
  } catch (e) {
    console.error("[Configuration] Failed to remove data from store!", e);
  }
};

export const getConfig = async (
  userId: string,
): Promise<Config | undefined> => {
  try {
    const { user_id, user_token, username, device_id, features } = await invoke<
      Args,
      ConfigResponse
    >()("get_config", { userId });

    if (!device_id) {
      throw new Error("Empty response");
    }

    return {
      userId: user_id,
      username,
      deviceId: device_id,
      userToken: user_token,
      features: features,
    };
  } catch (e) {
    console.error("[Configuration] Failed to get config!", e);
  }
};

export const getLoggedInUser = async (): Promise<Config | undefined> => {
  try {
    const response = await invoke<Args, ConfigResponse>()(
      "get_logged_in_user",
      {} as never,
    );

    if (!response) {
      return;
    }

    const { device_id, user_id, user_token, username } = response;

    return {
      userId: user_id,
      username,
      deviceId: device_id,
      userToken: user_token,
    };
  } catch (e) {
    console.error("[Configuration] Failed to get config!", e);
  }
};
