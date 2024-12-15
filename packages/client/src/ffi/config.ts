import { invoke } from "./invoke";

export type ConfigResponse = {
  device_id?: string;
  user_id?: string;
  username?: string;
  user_token?: string;
};

export type Config = {
  deviceId?: string;
  userId?: string;
  username?: string;
  userToken?: string;
};

export type ConfigRecord = {
  id?: number;
  config?: Config;
};

type Args = {
  add_user_data: Required<Config>;
  remove_user_data: never;
  get_config: never;
};

export const addUserData = async (payload: Required<Config>) => {
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

export const removeUserData = async () => {
  try {
    const res = await invoke<Args, boolean>()("remove_user_data", {} as never);

    if (!res) {
      throw "Unknown failure!";
    }

    return res;
  } catch (e) {
    console.error("[Configuration] Failed to remove data from store!", e);
  }
};

export const getConfig = async (): Promise<Config | void> => {
  try {
    const { user_id, user_token, username, device_id } = await invoke<
      Args,
      ConfigResponse
    >()("get_config", {} as never);

    if (!device_id) {
      throw new Error("Empty response");
    }

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
