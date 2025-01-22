import "react-toastify/dist/ReactToastify.css";
import "./App.css";

import { ToastContainer } from "react-toastify";
import { Explorer } from "./pages/explorer";
import { ConfigurationTray } from "./pages/configuration";
import { useEffect } from "react";
import { useConfig, useDevices, useOffline } from "./store";
import { useAuthRequests, useSync, useSyncRequests } from "./hooks";
import { getLoggedInUser } from "./ffi";
import { ky } from "./utils";

function App() {
  const { create: modifyConfig, config } = useConfig();
  const { create: addDevices, list: listDevices } = useDevices();
  const { initDevices } = useSyncRequests();
  const { setStatus } = useOffline();
  const { getFeatures } = useAuthRequests();
  const { status: syncStatus } = useSync();
  const { networkCall } = useOffline();

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
        response?.features,
      );
    })();
  }, [config, getFeatures, modifyConfig]);

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
