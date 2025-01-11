import { ToastContainer } from "react-toastify";
import "./App.css";
import { Explorer } from "./pages/explorer";
import "react-toastify/dist/ReactToastify.css";
import { ConfigurationTray } from "./pages/configuration";
import { useEffect } from "react";
import { useConfig, useDevices } from "./store";
import { useSync } from "./hooks";
import { DeviceIds } from "./ffi";
import { ky } from "./utils";

function App() {
  const { setConfig, config } = useConfig();
  const { create: addDevices } = useDevices();
  const { status: syncStatus } = useSync();

  useEffect(() => {
    (async () => {
      try {
        const { devices } = await ky
          .get<{ devices: DeviceIds }>("/auth/devices", {
            headers: {
              authorization: `Bearer ${config.userToken}`,
            },
          })
          .json();

        await addDevices(devices);
        return devices;
      } catch (e) {
        console.error("[Device] Init failed!");
      }
    })();
  }, [addDevices, config.userToken]);

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
