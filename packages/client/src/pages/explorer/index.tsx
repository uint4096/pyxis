import { styled } from "@linaria/react";
import { useEffect, useState } from "react";
import { WorkspaceSelection, CreateWorkspace } from "./forms";
import { useConfig, useTreeStore, useWorkspace } from "../../store";
import { Tree } from "../tree";
import Editor from "../editor/editor";
import { useContentSync } from "../../hooks";
import { ConfigurationTray } from "../configuration";

export const Explorer = () => {
  const { workspaces, list, currentWorkspace } = useWorkspace();
  const {
    selectedFile,
    updateSnapshots,
    insertUpdates,
    formattedContent,
    setFormattedContent,
  } = useTreeStore();
  const { getFileContent } = useContentSync();
  const { config } = useConfig();

  const [showWorkspaceForm, setWorkspaceForm] = useState<boolean>(false);
  const [explorerVisibility, setExplorerVisibility] = useState<boolean>(true);
  const [showWorkspaceSelectionForm, setWorkspaceSelectionForm] =
    useState<boolean>(false);

  const [showEditor, setEditor] = useState<boolean>(false);

  useEffect(() => {
    (async () => await list())();
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

    if (workspaces?.length && !currentWorkspace.uid) {
      setWorkspaceSelectionForm(true);
    } else {
      setWorkspaceSelectionForm(false);
      setEditor(true);
    }
  }, [currentWorkspace, workspaces]);

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
            updatesWriter={insertUpdates}
            snapshotWriter={updateSnapshots}
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
`;
