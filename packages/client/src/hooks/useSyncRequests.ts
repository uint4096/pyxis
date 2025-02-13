import { useCallback, useMemo } from "react";
import { DeviceIds, Sources } from "../ffi";
import { Document } from "./useSync";
import { useConfig, useDevices, useOffline } from "../store";
import { request } from "../utils";

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

  const http = useMemo(
    () => request({ headers: { authorization: `Bearer ${token}` } }),
    [token],
  );

  const initDevices = useCallback(
    async () =>
      await networkCall(
        () => http.get<{ devices: DeviceIds }>("/auth/devices"),
        {
          onError: async () => ({ devices: await listDevices() }),
          onOffline: async () => ({ devices: await listDevices() }),
        },
      ),
    [networkCall, http, listDevices],
  );

  const getDocuments = useCallback(
    async (
      sources: Array<Sources>,
      lastSyncedRecordId: number,
      deviceId: string,
    ) =>
      await networkCall(
        () =>
          http.get<{ documents: Array<Document> }>("/sync/document/list", {
            queryParams: {
              record_id: lastSyncedRecordId,
              is_snapshot: sources.includes("snapshots"),
              device_id: deviceId,
            },
          }),
        {
          onError: async () => ({ documents: [] as Array<Document> }),
          onOffline: async () => ({ documents: [] as Array<Document> }),
        },
      ),
    [http, networkCall],
  );

  const getUpdates = useCallback(
    async (deviceId: string, fileUid: string, snapshotId: number) =>
      await networkCall(
        () =>
          http.get<{ updates: Array<Update> }>("/sync/update/list", {
            queryParams: {
              file_uid: fileUid,
              snapshot_id: snapshotId,
              device_id: deviceId,
            },
          }),
        {
          onError: async () => ({ updates: [] as Array<Update> }),
          onOffline: async () => ({ updates: [] as Array<Update> }),
        },
      ),
    [http, networkCall],
  );

  return {
    getDocuments,
    initDevices,
    getUpdates,
  };
};
