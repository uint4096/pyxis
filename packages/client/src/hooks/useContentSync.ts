import { useCallback } from "react";
import { useConfig, useDevices, useTracker, useTreeStore } from "../store";
import { ky } from "../utils";
import type { Snapshot, Sources, Updates } from "../ffi";
import { Document } from "./useSync";

type Update = {
  pk: string;
  sk: string;
  payload: string;
};

export type FormattedContent = {
  fileContent: Uint8Array[];
  snapshotId: number;
};

export const useContentSync = () => {
  const { config } = useConfig();
  const { deviceIds } = useDevices();
  const { getSyncedRecordId, updateRecord } = useTracker();
  const { getContent } = useTreeStore();

  const getDocuments = useCallback(
    async (deviceId: string, fileUid: string) => {
      const { userToken } = config ?? {};

      if (!userToken) {
        return;
      }

      const sources = ["snapshots"] as Array<Sources>;

      const lastSyncedRecordId = await getSyncedRecordId(deviceId, sources);

      if (lastSyncedRecordId == null) {
        console.error("Failed to fetch last record id. Aborting sync...");
        return;
      }

      const { documents } = await ky
        .get<{ documents: Array<Document> }>("/sync/document/list", {
          headers: {
            authorization: `Bearer ${userToken}`,
          },
          searchParams: {
            record_id: lastSyncedRecordId,
            is_snapshot: true,
            device_id: deviceId,
          },
        })
        .json();

      return documents.filter((document) => document.file_uid === fileUid);
    },
    [config, getSyncedRecordId],
  );

  const getUpdates = useCallback(
    async (deviceId: string, fileUid: string, snapshotId: number) => {
      const { updates } = await ky
        .get<{ updates: Array<Update> }>("/sync/update/list", {
          headers: {
            authorization: `Bearer ${config?.userToken}`,
          },
          searchParams: {
            file_uid: fileUid,
            snapshot_id: snapshotId,
            device_id: deviceId,
          },
        })
        .json();

      return updates;
    },
    [config?.userToken],
  );

  const getFileContent = useCallback(
    async (fileUid: string): Promise<FormattedContent | undefined> => {
      try {
        const documents = await Promise.all(
          deviceIds
            .filter((id) => id !== config.deviceId)
            .map((device) => getDocuments(device, fileUid)),
        );

        const syncedSnapshots = documents
          .flatMap((documents) => documents?.sort((a, b) => b.sk - a.sk)?.[0])
          .filter(Boolean)
          .map((snapshot) => ({
            ...snapshot,
            payload: JSON.parse(snapshot?.payload ?? "") as Snapshot,
          }));

        const updates = (
          await Promise.all(
            (syncedSnapshots || [])
              .filter(Boolean)
              .map((snapshot) =>
                getUpdates(
                  snapshot.pk?.split("/")?.[1] ?? "",
                  fileUid,
                  snapshot.payload?.snapshot_id,
                ),
              ),
          )
        )
          .flat()
          .map((update) => ({
            ...update,
            payload: JSON.parse(update?.payload ?? "") as Updates,
          }));

        const { snapshot: localSnapshot, updates: localUpdates } =
          await getContent(fileUid);

        const fileContent = [
          localSnapshot?.content,
          ...localUpdates,
          ...syncedSnapshots.map(({ payload }) =>
            payload.content
              ? Uint8Array.from(payload.content)
              : new Uint8Array(),
          ),
          ...updates.map(({ payload }) =>
            payload.content
              ? Uint8Array.from(payload.content)
              : new Uint8Array(),
          ),
        ].filter(Boolean);

        const documentsRecordIdMap = documents.reduce<Record<string, number>>(
          (map, documentsByDevice) => {
            const lastSyncedRecord = documentsByDevice?.sort(
              (a, b) => b.sk - a.sk,
            )[0];

            const deviceId = lastSyncedRecord?.pk?.split("/")?.[1];

            if (!lastSyncedRecord || !deviceId) {
              return map;
            }

            map[deviceId] = lastSyncedRecord.sk;
            return map;
          },
          {},
        );

        await Promise.all(
          Object.entries(documentsRecordIdMap).map(([deviceId, recordId]) =>
            updateRecord(deviceId, "snapshots", recordId),
          ),
        );

        return {
          fileContent: fileContent as Array<Uint8Array>,
          snapshotId: localSnapshot?.snapshot_id ?? 0,
        };
      } catch (e) {
        console.error("[Content Sync] Failed operation!", e);
      }
    },
    [
      config.deviceId,
      deviceIds,
      getContent,
      getDocuments,
      getUpdates,
      updateRecord,
    ],
  );

  return { getFileContent };
};
