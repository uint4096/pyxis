import { ToastContainer } from "react-toastify";
import "./App.css";
import { Explorer } from "./pages/explorer";
import "react-toastify/dist/ReactToastify.css";
import { ConfigurationTray } from "./pages/configuration";
import { useCallback, useEffect } from "react";
import { useConfig } from "./store";
import { ky, toast } from "./utils";
import { DeviceIds } from "./ffi";
import { useDevices } from "./store/useDevices";
import { getLastSyncedRecordId } from "./ffi/tracker";

function App() {
  const { setConfig, config } = useConfig();
  const { create: addDevices } = useDevices();

  const syncDocuments = useCallback(async () => {
    if (!config?.deviceId || !config?.userToken) {
      return;
    }

    const { deviceId, userToken } = config;

    const lastSyncedRecordId = await getLastSyncedRecordId(deviceId, [
      "workspaces",
      "files",
      "directories",
    ]);

    if (lastSyncedRecordId == null) {
      console.error("Failed to fetch last record id. Aborting sync...");
      toast("Failed to sync documents");
      return;
    }
  }, [config]);
  const initDevices = useCallback(
    async (token: string) => {
      try {
        const { devices } = await ky
          .get<{ devices: DeviceIds }>("/auth/devices", {
            headers: {
              authorization: `Bearer ${token}`,
            },
          })
          .json();

        await addDevices(devices);
      } catch (e) {
        console.error("[Device] Init failed!");
      }
    },
    [addDevices],
  );

  useEffect(() => {
    (async () => {
      await setConfig();
      if (config.userToken) {
        await initDevices(config.userToken);
      }
    })();
  }, [config.userToken, initDevices, setConfig]);

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
