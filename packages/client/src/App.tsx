import "react-toastify/dist/ReactToastify.css";
import "./App.css";

import { ToastContainer } from "react-toastify";
import { Explorer } from "./pages/explorer";
import { ConfigurationTray } from "./pages/configuration";
import { useEffect } from "react";
import { useConfig, useDevices, useOffline } from "./store";
import { useAuthRequests, useSync, useSyncRequests } from "./hooks";
import { ConfigResponse, getLoggedInUser } from "./ffi";
import { ky } from "./utils";
import { jwtDecode } from "jwt-decode";

type DecodedToken = {
  user: Pick<ConfigResponse, "user_id" | "username">;
  exp: number;
};

function App() {
  const {
    create: modifyConfig,
    config,
    setConfig,
    delete: deleteConfig,
  } = useConfig();
  const { create: addDevices, list: listDevices } = useDevices();
  const { initDevices } = useSyncRequests();
  const { setStatus, status } = useOffline();
  const { getFeatures, logout } = useAuthRequests();
  const { status: syncStatus } = useSync();
  const { networkCall } = useOffline();

  const decodeToken = (token: string): DecodedToken | null => {
    try {
      return jwtDecode(token);
    } catch (e) {
      console.error("[Auth] Error while decoding token!", e);
      return null;
    }
  };

  useEffect(() => {
    const ping = async () => {
      try {
        await ky.get("/sync/ping");
        setStatus("online");
      } catch {
        setStatus("offline");
      }
    };

    (async () => await ping())();
    const interval = setInterval(ping, 5000);

    return () => clearInterval(interval);
  }, [setStatus]);

  useEffect(() => {
    (async () => {
      const userDetails = await getLoggedInUser();
      if (!userDetails?.userId) {
        //@todo: open signup/in modal
        return;
      }

      if (userDetails.userToken) {
        const decodedToken = decodeToken(userDetails.userToken);
        const currentTime = new Date().getTime();
        if (!decodedToken || decodedToken.exp * 1000 < currentTime) {
          await logout();
          await deleteConfig(userDetails.userId);
          return;
        }
      }

      await setConfig(userDetails);
    })();
  }, [deleteConfig, logout, setConfig]);

  useEffect(() => {
    const { username, userToken, userId, deviceId } = config ?? {};
    if (!userToken || !userId || !username || !deviceId) {
      return;
    }

    (async () => {
      const { response } = await getFeatures(config.userId!);
      await modifyConfig(
        username,
        userId,
        userToken,
        deviceId,
        response?.features?.features,
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config?.username,
    config?.userToken,
    config?.deviceId,
    config?.userId,
    getFeatures,
    modifyConfig,
    status,
  ]);

  useEffect(() => {
    (async () => {
      try {
        if (!config?.userToken) {
          return;
        }

        const { response } = await initDevices();
        await addDevices(response?.devices ?? []);
      } catch (e) {
        console.error("[Device] Init failed!");
      }
    })();
  }, [addDevices, config?.userToken, initDevices, listDevices, networkCall]);

  return (
    <>
      <ConfigurationTray />
      {config.userToken && <Explorer />}
      <ToastContainer
        position={"bottom-right"}
        autoClose={3000}
        theme={"dark"}
        hideProgressBar
      />
    </>
  );
}

export default App;
