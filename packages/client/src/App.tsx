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
import { getLastSyncedRecordId, Sources } from "./ffi/tracker";

type Document = {
  pk: `${string}/${string}`;
  sk: number;
  payload: string;
  operation: "insert" | "update" | "delete";
  source: Sources;
};

function App() {
  const { setConfig, config } = useConfig();
  const { create: addDevices } = useDevices();

  const getDocuments = useCallback(
    async (deviceId: string) => {
      const { userToken } = config ?? {};

      if (!userToken) {
        return;
      }

      const sources = ["workspaces", "files", "directories"] as Array<Sources>;

      const lastSyncedRecordId = await getLastSyncedRecordId(deviceId, sources);

      if (lastSyncedRecordId == null) {
        console.error("Failed to fetch last record id. Aborting sync...");
        toast("Failed to sync documents");
        return;
      }

      const documents = await ky
        .get<{ payload: Array<Document> }>("/sync/document/list", {
          headers: {
            authorization: `Bearer ${userToken}`,
          },
          searchParams: {
            record_id: lastSyncedRecordId,
            is_snapshot: false,
          },
        })
        .json();

      return documents;
    },
    [config],
  );
  const initDevices = useCallback(async () => {
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
  }, [addDevices, config.userToken]);

  useEffect(() => {
    (async () => {
      await setConfig();
    })();
  }, [setConfig]);

  useEffect(() => {
    (async () => {
      if (!config.userToken) {
        return;
      }

      const devices = await initDevices();
      const documents = await Promise.all(
        (devices ?? [])?.map(async (device) => await getDocuments(device)),
      );
      console.log(documents);
    })();
  }, [config.userToken, getDocuments, initDevices]);

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
