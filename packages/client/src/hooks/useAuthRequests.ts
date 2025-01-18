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

  return {
    registerOrLogin,
    logout,
  };
};
