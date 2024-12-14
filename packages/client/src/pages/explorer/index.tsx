import { styled } from "@linaria/react";
import { useEffect, useState } from "react";
import { WorkspaceSelection, CreateWorkspace } from "./forms";
import { useTreeStore, useWorkspace } from "../../store";
import { Tree } from "../tree";
import Editor from "../editor/editor";

export const Explorer = () => {
  const { workspaces, list, currentWorkspace } = useWorkspace();
  const { selectedFile, updateContent, doc } = useTreeStore();

  const [showWorkspaceForm, setWorkspaceForm] = useState<boolean>(false);
  const [showWorkspaceSelectionForm, setWorkspaceSelectionForm] =
    useState<boolean>(false);

  const [showEditor, setEditor] = useState<boolean>(false);

  useEffect(() => {
    (async () => await list())();
  }, [list]);

  useEffect(() => {
    if (!workspaces || !workspaces.length) {
      setWorkspaceForm(true);
    } else {
      setWorkspaceForm(false);
    }

    if (!currentWorkspace) {
      setWorkspaceSelectionForm(true);
    } else {
      setWorkspaceSelectionForm(false);
      setEditor(true);
    }
  }, [currentWorkspace, workspaces]);

  return (
    <>
      <ExplorerWrapper>
        {currentWorkspace && <Tree />}

        {showEditor && selectedFile?.id && (
          <Editor
            key={selectedFile.id}
            fileId={selectedFile.id}
            content={doc ?? new Uint8Array()}
            writer={updateContent}
          />
        )}

        {/* Modals and Forms */}
        {showWorkspaceForm && !currentWorkspace && (
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
  justify-content: flex-start;
  align-items: flex-start;
  padding: 1vh 5vw;
  height: 100%;
  flex-grow: 1;
  gap: 5vw;
`;
