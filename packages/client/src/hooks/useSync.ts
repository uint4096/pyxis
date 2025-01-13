import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DirWithChildren,
  useConfig,
  useDevices,
  useTracker,
  useTreeStore,
  useWorkspace,
} from "../store";
import { ky } from "../utils";
import {
  deleteWorkspace,
  type Directory,
  type File,
  type Sources,
  type Workspace,
} from "../ffi";

type DocumentSources = Exclude<Sources, "updates" | "snapshots">;

export type Document = {
  pk: `${string}/${string}`;
  sk: number;
  payload: string;
  operation: "insert" | "update" | "delete";
  source: DocumentSources;
};

type DocumentSource<T extends DocumentSources> = T extends "files"
  ? File
  : T extends "directories"
    ? Directory
    : T extends "workspaces"
      ? Workspace
      : never;

type DocumentHandlers = {
  [K in DocumentSources]: (document: DocumentSource<K>) => Promise<void>;
};

export const useSync = () => {
  const [status, setStatus] = useState(true);

  const { config } = useConfig();
  const { deviceIds } = useDevices();
  const {
    isDuplicate: isDuplicateWorkspace,
    create: createWorkspace,
    updateWorkspace,
  } = useWorkspace();
  const {
    isDuplicateFile,
    isDuplicateDirectory,
    createFile,
    createDir,
    updateFile,
    updateDir,
    deleteDir,
    deleteFile,
  } = useTreeStore();
  const { getSyncedRecordId, updateRecord } = useTracker();

  const insertHandlers: DocumentHandlers = useMemo(
    () => ({
      directories: async (directory) => {
        const {
          created_at,
          path,
          name,
          workspace_uid,
          parent_uid,
          uid,
          updated_at,
        } = directory;
        if (!(await isDuplicateDirectory(path, workspace_uid))) {
          await createDir(
            name,
            workspace_uid,
            path,
            parent_uid,
            uid,
            created_at,
            updated_at,
          );
        }
      },
      files: async (file) => {
        const {
          title,
          created_at,
          links,
          path,
          tags,
          workspace_uid,
          dir_uid,
          uid,
          updated_at,
        } = file;
        if (!(await isDuplicateFile(path, workspace_uid))) {
          await createFile(
            title,
            workspace_uid,
            path,
            links,
            tags,
            dir_uid,
            uid,
            created_at,
            updated_at,
          );
        }
      },
      workspaces: async (workspace) => {
        const { name, uid, created_at, updated_at } = workspace;
        if (!(await isDuplicateWorkspace(name))) {
          await createWorkspace(name, uid, created_at, updated_at);
        }
      },
    }),
    [
      createDir,
      createFile,
      createWorkspace,
      isDuplicateDirectory,
      isDuplicateFile,
      isDuplicateWorkspace,
    ],
  );

  const handleInserts = useCallback(
    async <T extends DocumentSources>(source: T, doc: DocumentSource<T>) =>
      await insertHandlers[source](doc),
    [insertHandlers],
  );

  const updateHandlers: DocumentHandlers = useMemo(
    () => ({
      directories: async (directory) =>
        await updateDir(directory as DirWithChildren),
      files: async (file) => await updateFile(file),
      workspaces: async (workspace) => {
        const { name, uid } = workspace;
        await updateWorkspace(name, uid);
      },
    }),
    [updateDir, updateFile, updateWorkspace],
  );

  const handleUpdates = useCallback(
    async <T extends DocumentSources>(source: T, doc: DocumentSource<T>) =>
      await updateHandlers[source](doc),
    [updateHandlers],
  );

  const deleteHandlers: DocumentHandlers = useMemo(
    () => ({
      directories: async (directory) =>
        await deleteDir(directory as DirWithChildren),
      files: async (file) => await deleteFile(file),
      workspaces: async (workspace) => await deleteWorkspace(workspace.uid),
    }),
    [deleteDir, deleteFile],
  );

  const handleDeletes = useCallback(
    async <T extends DocumentSources>(source: T, doc: DocumentSource<T>) =>
      await deleteHandlers[source](doc),
    [deleteHandlers],
  );

  const operationHandlers: {
    [key in Document["operation"]]: (document: Document) => Promise<void>;
  } = useMemo(
    () => ({
      insert: async (document) => {
        const { payload, source } = document;
        const doc = JSON.parse(payload) as DocumentSource<typeof source>;
        return handleInserts(source, doc);
      },
      update: async (document) => {
        const { payload, source } = document;
        const doc = JSON.parse(payload) as DocumentSource<typeof source>;
        return handleUpdates(source, doc);
      },
      delete: async (document) => {
        const { payload, source } = document;
        const doc = JSON.parse(payload) as DocumentSource<typeof source>;
        return handleDeletes(source, doc);
      },
    }),
    [handleDeletes, handleInserts, handleUpdates],
  );

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

      const { documents } = await ky
        .get<{ documents: Array<Document> }>("/sync/document/list", {
          headers: {
            authorization: `Bearer ${userToken}`,
          },
          searchParams: {
            record_id: lastSyncedRecordId,
            is_snapshot: false,
            device_id: deviceId,
          },
        })
        .json();

      return documents;
    },
    [config, getSyncedRecordId],
  );

  useEffect(() => {
    (async () => {
      try {
        const documents = await Promise.all(
          deviceIds
            .filter((id) => id !== config.deviceId)
            .map((device) => getDocuments(device)),
        );

        // @todo: handle unsynced documents
        const responses = await Promise.allSettled(
          (documents || [])
            .flat()
            .filter(Boolean)
            .map(async (doc) => operationHandlers[doc!.operation](doc!)),
        );

        const documentsRecordIdMap = documents.reduce<
          Record<string, { source: Sources; recordId: number }>
        >((map, documentsByDevice) => {
          const lastSyncedRecord = documentsByDevice?.sort(
            (a, b) => b.sk - a.sk,
          )[0];

          const deviceId = lastSyncedRecord?.pk?.split("/")?.[1];

          if (!lastSyncedRecord || !deviceId) {
            return map;
          }

          map[deviceId] = {
            source: lastSyncedRecord.source,
            recordId: lastSyncedRecord.sk,
          };
          return map;
        }, {});

        await Promise.all(
          Object.entries(documentsRecordIdMap).map(
            ([deviceId, { source, recordId }]) =>
              updateRecord(deviceId, source, recordId),
          ),
        );
      } catch (e) {
        console.error("[Sync] Failed operation!", e);
        setStatus(false);
      }
    })();
  }, [deviceIds, getDocuments, operationHandlers, updateRecord]);

  return { status };
};
