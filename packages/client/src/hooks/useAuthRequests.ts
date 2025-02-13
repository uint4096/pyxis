import { useCallback, useMemo } from "react";
import { ConfigResponse } from "../ffi";
import { useConfig, useOffline } from "../store";
import { request } from "../utils";

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

  const http = useMemo(
    () => request({ headers: { authorization: `Bearer ${token}` } }),
    [token],
  );

  const registerOrLogin = useCallback(
    async (type: "signin" | "signup", body: SigninPayload) =>
      await networkCall(() =>
        http.post<Required<ConfigResponse>>(
          type === "signin" ? "/auth/signin" : "/auth/signup",
          {
            json: body,
          },
        ),
      ),
    [http, networkCall],
  );

  const logout = useCallback(
    async () => await networkCall(() => http.post<void>("/auth/signout")),
    [http, networkCall],
  );

  const requestFeatureAccess = useCallback(
    async (key: string) =>
      await networkCall(() =>
        http.post<Required<ConfigResponse>>("/auth/features", {
          json: { key, value: "requested" },
        }),
      ),
    [http, networkCall],
  );

  const getFeatures = useCallback(
    async (userId: string) =>
      await networkCall(
        () =>
          http.get<{
            features: FeatureRecord;
          }>("/auth/features"),
        {
          onError: async () => ({
            features: (await getConfig(userId)) as FeatureRecord,
          }),
          onOffline: async () => ({
            features: (await getConfig(userId)) as FeatureRecord,
          }),
        },
      ),
    [networkCall, http, getConfig],
  );

  return {
    registerOrLogin,
    logout,
    requestFeatureAccess,
    getFeatures,
  };
};
