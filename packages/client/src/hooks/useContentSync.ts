import { useCallback } from "react";
import {
  FormattedContent,
  useConfig,
  useDevices,
  useTracker,
  useTreeStore,
} from "../store";
import type { Snapshot, Sources, Updates } from "../ffi";
import { useSyncRequests } from "./useSyncRequests";
import { toast } from "../utils";

export const useContentSync = () => {
  const { config } = useConfig();
  const { list: listDevices } = useDevices();
  const { getSyncedRecordId, updateRecord } = useTracker();
  const { getContent } = useTreeStore();
  const { getDocuments: getSnapshots, getUpdates } = useSyncRequests();

  const getDocuments = useCallback(
    async (deviceId: string, fileUid: string) => {
      if (!config?.userToken || !config?.userId) {
        return [];
      }

      const sources = ["snapshots"] as Array<Sources>;
      const lastSyncedRecordId = await getSyncedRecordId(
        deviceId,
        sources,
        config.userId,
      );

      if (lastSyncedRecordId == null) {
        console.error("Failed to fetch last record id. Aborting sync...");
        return;
      }

      const { response } = await getSnapshots(
        sources,
        lastSyncedRecordId,
        deviceId,
      );

      return (response?.documents || []).filter(
        (document) => document.file_uid === fileUid,
      );
    },
    [config.userId, config?.userToken, getSnapshots, getSyncedRecordId],
  );

  const getUpdatesList = useCallback(
    async (deviceId: string, fileUid: string, snapshotId: number) => {
      if (!config?.userToken) {
        return [];
      }

      const { response } = await getUpdates(deviceId, fileUid, snapshotId);

      return response?.updates ?? [];
    },
    [config?.userToken, getUpdates],
  );

  const getFileContent = useCallback(
    async (fileUid: string): Promise<FormattedContent | undefined> => {
      if (!config.userId) {
        return;
      }

      try {
        const deviceIds = await listDevices();
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
                getUpdatesList(
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
            updateRecord(deviceId, "snapshots", recordId, config.userId!),
          ),
        );

        return {
          fileContent: fileContent as Array<Uint8Array>,
          snapshotId: localSnapshot?.snapshot_id ?? 0,
        };
      } catch (e) {
        console.error("[Content Sync] Failed operation!", e);
        toast("Failed to get file content!");
      }
    },
    [
      config.deviceId,
      config.userId,
      getContent,
      getDocuments,
      getUpdatesList,
      listDevices,
      updateRecord,
    ],
  );

  return { getFileContent };
};
