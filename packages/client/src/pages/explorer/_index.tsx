import { styled } from "@linaria/react";
import { useEffect, useState } from "react";
import { WorkspaceSelection } from "./forms/workspace-list";

import { useWorkspace } from "../../store/use-workspace";
import { CreateWorkspace } from "./forms/workspace";
import { Tree } from "../tree";

export const Explorer = () => {
  const { workspaces, list, currentWorkspace } = useWorkspace();

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

        {/* {showEditor && !noWorkspaces && file.name && workspacePath && (
        <Editor
          fileWithContent={{ ...file, content }}
          writer={saveFileContent(workspacePath)}
        />
      )} */}

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
  padding: 7vh 5vw;
  height: 100%;
  flex-grow: 1;
  gap: 5vw;
`;
