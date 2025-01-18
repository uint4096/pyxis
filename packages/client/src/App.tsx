import "react-toastify/dist/ReactToastify.css";
import "./App.css";

import { ToastContainer } from "react-toastify";
import { Explorer } from "./pages/explorer";
import { ConfigurationTray } from "./pages/configuration";
import { useEffect } from "react";
import { useConfig, useDevices } from "./store";
import { useOffline, useSync, useSyncRequests } from "./hooks";

function App() {
  const { setConfig, config } = useConfig();
  const { create: addDevices, list: listDevices } = useDevices();
  const { initDevices } = useSyncRequests();
  const { status: syncStatus } = useSync();
  const { networkCall } = useOffline();

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

  useEffect(() => {
    (async () => {
      await setConfig();
    })();
  }, [setConfig]);

  return (
    <>
      <ConfigurationTray />
      <Explorer />
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
