import { useCallback } from "react";
import { ConfigResponse } from "../ffi";
import { useConfig } from "../store";
import { ky } from "../utils";
import { useOffline } from "./useOffline";

type SigninPayload = {
  username: string;
  password: string;
  device_id?: string;
};

export const useAuthRequests = () => {
  const { networkCall } = useOffline();
  const {
    config: { userToken: token },
    get: getConfig,
  } = useConfig();

  const registerOrLogin = useCallback(
    async (type: "signin" | "signup", body: SigninPayload) =>
      await networkCall(() =>
        ky
          .post<Required<ConfigResponse>>(
            type === "signin" ? "/auth/signin" : "/auth/signup",
            {
              json: body,
            },
          )
          .json(),
      ),
    [networkCall],
  );

  const logout = useCallback(
    async () =>
      await networkCall(() =>
        ky
          .post<void>("/auth/signout", {
            headers: {
              authorization: `Bearer ${token}`,
            },
          })
          .json(),
      ),
    [networkCall, token],
  );

  const requestFeatureAccess = useCallback(
    async (key: string) =>
      await networkCall(() =>
        ky
          .post<Required<ConfigResponse>>("/auth/features", {
            json: { key, value: "requested" },
            headers: {
              authorization: `Bearer ${token}`,
            },
          })
          .json(),
      ),
    [networkCall, token],
  );

  const getFeatures = useCallback(
    async (userId: string) =>
      await networkCall(
        () =>
          ky
            .get<{ features: Record<string, string> | undefined }>(
              "/auth/features",
              {
                headers: {
                  authorization: `Bearer ${token}`,
                },
              },
            )
            .json(),
        {
          onError: async () => ({
            features: (await getConfig(userId))?.features,
          }),
          onOffline: async () => ({
            features: (await getConfig(userId))?.features,
          }),
        },
      ),
    [networkCall, token, getConfig],
  );

  return {
    registerOrLogin,
    logout,
    requestFeatureAccess,
    getFeatures,
  };
};
