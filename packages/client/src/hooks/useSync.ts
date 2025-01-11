import { useCallback } from "react";
import {
  useConfig,
  useDevices,
  useTracker,
  useTreeStore,
  useWorkspace,
} from "../store";
import { ky } from "../utils";
import { DeviceIds, Directory, File, Sources, Workspace } from "../ffi";

type DocumentSources = Exclude<Sources, "updates" | "snapshots">;

export type Document = {
  pk: `${string}/${string}`;
  sk: number;
  payload: string;
  operation: "insert" | "update" | "delete";
  source: DocumentSources;
};

export const useSync = () => {
  const { config } = useConfig();
  const { create: addDevices } = useDevices();
  const { isDuplicate: isDuplicateWorkspace, create: createWorkspace } =
    useWorkspace();
  const { isDuplicateFile, isDuplicateDirectory, createFile, createDir } =
    useTreeStore();
  const { getSyncedRecordId } = useTracker();

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

  const getDocuments = useCallback(
    async (deviceId: string) => {
      const { userToken } = config ?? {};

      if (!userToken) {
        return;
      }

      const sources = ["workspaces", "files", "directories"] as Array<Sources>;

      const lastSyncedRecordId = await getSyncedRecordId(deviceId, sources);

      if (lastSyncedRecordId == null) {
        console.error("Failed to fetch last record id. Aborting sync...");
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
    [config, getSyncedRecordId],
  );

  return {
    initDevices,
    getDocuments,
  };
};
