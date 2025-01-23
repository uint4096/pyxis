import { useCallback } from "react";
import { ConfigResponse } from "../ffi";
import { useConfig, useOffline } from "../store";
import { ky } from "../utils";

type SigninPayload = {
  username: string;
  password: string;
  device_id?: string;
};

type FeatureRecord = {
  user_id?: string;
  features: Record<string, string> | undefined;
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
            .get<{
              features: FeatureRecord;
            }>("/auth/features", {
              headers: {
                authorization: `Bearer ${token}`,
              },
            })
            .json(),
        {
          onError: async () => ({
            features: (await getConfig(userId)) as FeatureRecord,
          }),
          onOffline: async () => ({
            features: (await getConfig(userId)) as FeatureRecord,
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
