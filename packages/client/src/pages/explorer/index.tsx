import { styled } from "@linaria/react";
import { useCallback, useEffect, useState } from "react";
import { WorkspaceSelection, CreateWorkspace } from "./forms";
import { useConfig, useTreeStore, useWorkspace } from "../../store";
import { Tree } from "../tree";
import Editor from "../editor/editor";
import { useContentSync } from "../../hooks";
import { ConfigurationTray } from "../configuration";
import { toast } from "../../utils";

export const Explorer = () => {
  const { workspaces, list, currentWorkspace } = useWorkspace();
  const {
    selectedFile,
    updateSnapshots,
    insertUpdates,
    formattedContent,
    setFormattedContent,
    selectFile,
  } = useTreeStore();
  const { getFileContent } = useContentSync();
  const { config } = useConfig();

  const [showWorkspaceForm, setWorkspaceForm] = useState<boolean>(false);
  const [explorerVisibility, setExplorerVisibility] = useState<boolean>(true);
  const [showWorkspaceSelectionForm, setWorkspaceSelectionForm] =
    useState<boolean>(false);

  const [showEditor, setEditor] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        await list();
      } catch {
        toast("Failed to fetch workspaces!");
      }
    })();
  }, [list]);

  useEffect(() => {
    if (selectedFile?.uid) {
      (async () => {
        const { fileContent, snapshotId } =
          (await getFileContent(selectedFile.uid!)) ?? {};

        if (fileContent?.length && snapshotId != null) {
          setFormattedContent({ fileContent, snapshotId });
        } else {
          setFormattedContent({ fileContent: [], snapshotId: 0 });
        }
      })();
    } else {
      setFormattedContent(undefined);
    }

    return () => setFormattedContent(undefined);
  }, [getFileContent, selectedFile?.uid, setFormattedContent]);

  useEffect(() => {
    if (!workspaces || !workspaces.length) {
      setWorkspaceForm(true);
    } else {
      setWorkspaceForm(false);
    }

    if (workspaces?.length && !currentWorkspace?.uid) {
      setWorkspaceSelectionForm(true);
    } else {
      setWorkspaceSelectionForm(false);
      setEditor(true);
    }

    return () => {
      setEditor(false);
      selectFile(undefined);
    };
  }, [currentWorkspace, selectFile, workspaces]);

  const snapshotsUpdate = useCallback(
    async (fileUid: string, content: Uint8Array) => {
      try {
        return await updateSnapshots(fileUid, content);
      } catch {
        toast("Failed to save! Your changes might be lost.");
      }
    },
    [updateSnapshots],
  );

  const updatesInsert = useCallback(
    async (fileUid: string, snapshotId: number, content: Uint8Array) => {
      try {
        return await insertUpdates(fileUid, snapshotId, content);
      } catch {
        toast("Failed to save! Your changes might be lost.");
      }
    },
    [insertUpdates],
  );

  return (
    <>
      <ExplorerWrapper>
        {config.userToken && (
          <ConfigurationTray
            explorerVisibility={explorerVisibility}
            setExplorerVisibility={setExplorerVisibility}
          />
        )}
        {currentWorkspace?.uid && (
          <Tree
            explorerVisibility={explorerVisibility}
            setExplorerVisibility={setExplorerVisibility}
          />
        )}

        {showEditor && selectedFile?.uid && formattedContent && (
          <Editor
            key={selectedFile.uid}
            fileUid={selectedFile.uid}
            content={formattedContent}
            updatesWriter={updatesInsert}
            snapshotWriter={snapshotsUpdate}
          />
        )}

        {/* Modals and Forms */}
        {showWorkspaceForm && !currentWorkspace?.uid && (
          <CreateWorkspace setVisibility={setWorkspaceForm} />
        )}
        {showWorkspaceSelectionForm && workspaces.length > 0 && (
          <WorkspaceSelection
            workspaces={workspaces}
            setVisibility={setWorkspaceSelectionForm}
          />
        )}
      </ExplorerWrapper>
    </>
  );
};

const ExplorerWrapper = styled.div`
  display: flex;
  height: 100%;
  font-family: "Poppins";
  width: 100%;
  overflow: hidden;
  font-size: 0.9em;
`;
