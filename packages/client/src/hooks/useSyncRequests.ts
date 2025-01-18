import { useCallback } from "react";
import { DeviceIds, Sources } from "../ffi";
import { Document } from "./useSync";
import { useConfig, useDevices } from "../store";
import { ky } from "../utils";
import { useOffline } from "./useOffline";

type Update = {
  pk: string;
  sk: string;
  payload: string;
};

export const useSyncRequests = () => {
  const { networkCall } = useOffline();
  const { list: listDevices } = useDevices();
  const {
    config: { userToken: token },
  } = useConfig();

  const initDevices = useCallback(
    async () =>
      await networkCall(
        () =>
          ky
            .get<{ devices: DeviceIds }>("/auth/devices", {
              headers: {
                authorization: `Bearer ${token}`,
              },
            })
            .json(),
        {
          onError: async () => ({ devices: await listDevices() }),
          onOffline: async () => ({ devices: await listDevices() }),
        },
      ),
    [token, listDevices, networkCall],
  );

  const getDocuments = useCallback(
    async (
      sources: Array<Sources>,
      lastSyncedRecordId: number,
      deviceId: string,
    ) =>
      await networkCall(
        () =>
          ky
            .get<{ documents: Array<Document> }>("/sync/document/list", {
              headers: {
                authorization: `Bearer ${token}`,
              },
              searchParams: {
                record_id: lastSyncedRecordId,
                is_snapshot: sources.includes("snapshots"),
                device_id: deviceId,
              },
            })
            .json(),
        {
          onError: async () => ({ documents: [] as Array<Document> }),
          onOffline: async () => ({ documents: [] as Array<Document> }),
        },
      ),
    [networkCall, token],
  );

  const getUpdates = useCallback(
    async (deviceId: string, fileUid: string, snapshotId: number) =>
      await networkCall(
        () =>
          ky
            .get<{ updates: Array<Update> }>("/sync/update/list", {
              headers: {
                authorization: `Bearer ${token}`,
              },
              searchParams: {
                file_uid: fileUid,
                snapshot_id: snapshotId,
                device_id: deviceId,
              },
            })
            .json(),
        {
          onError: async () => ({ updates: [] as Array<Update> }),
          onOffline: async () => ({ updates: [] as Array<Update> }),
        },
      ),
    [networkCall, token],
  );

  return {
    getDocuments,
    initDevices,
    getUpdates,
  };
};
