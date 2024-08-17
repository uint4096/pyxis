import { styled } from "@linaria/react";
import { useCallback, useEffect, useState } from "react";
import type { StoreConfig, SystemConfig } from "../../store/types";
import { NoWorkspaceMessage } from "./forms/no-workspace";
import { WorkspaceSelection } from "./forms/workspace-list";

import { useWorkspace } from "../../store/use-workspace";
import { CreateWorkspace } from "./forms/workspace";

export type TConfigContext = {
  storeConfig: StoreConfig;
  systemConfig: SystemConfig;
  workspacePath: string;
};

export const Explorer = () => {
  const { workspaces, list } = useWorkspace();

  const [showWorkspaceForm, setWorkspaceForm] = useState<boolean>(false);
  const [showWorkspaceSelectionForm, setWorkspaceSelectionForm] =
    useState<boolean>(false);
  const [noWorkspaces, setNoWorkspaces] = useState<boolean>(false);

  const [showEditor, setEditor] = useState<boolean>(false);

  const onWorkspaceCreation = useCallback(() => {
    if (noWorkspaces) {
      setNoWorkspaces(false);
    }

    setWorkspaceForm(false);
    setEditor(true);
  }, [noWorkspaces]);

  useEffect(() => {
    (async () => await list())();
  }, [list]);

  useEffect(() => {
    if (!workspaces || !workspaces.length) {
      setNoWorkspaces(true);
    } else {
      setNoWorkspaces(false);
    }

    if (!workspaces.some((w) => w.selected)) {
      setWorkspaceSelectionForm(true);
    } else {
      setWorkspaceSelectionForm(false);
    }
  }, [workspaces]);

  return (
    <>
      <ExplorerWrapper>
        {/* {workspaceConfig && systemConfig && storeConfig?.selected_workspace && (
        <Tree />
      )} */}

        {/* {showEditor && !noWorkspaces && file.name && workspacePath && (
        <Editor
          fileWithContent={{ ...file, content }}
          writer={saveFileContent(workspacePath)}
        />
      )} */}

        {/* Modals and Forms */}
        {noWorkspaces && (
          <NoWorkspaceMessage onCreate={() => setWorkspaceForm(true)} />
        )}
        {showWorkspaceForm && (
          <CreateWorkspace onCreate={onWorkspaceCreation} />
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
