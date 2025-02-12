import { styled } from "@linaria/react";
import { useCallback, useEffect } from "react";
import { Modal } from "../../../components";
import { Workspace } from "../../../ffi";
import { useTreeStore, useWorkspace } from "../../../store";
import { noop } from "../../../utils";
import { Trash } from "../../../icons";

type WorkspaceListProps = {
  workspaces: Array<Partial<Workspace>>;
  setVisibility: React.Dispatch<React.SetStateAction<boolean>>;
  allowClosing?: boolean;
  onCreate?: () => void;
};

export const WorkspaceSelection = ({
  workspaces,
  setVisibility,
  allowClosing,
  onCreate,
}: WorkspaceListProps) => {
  const { updateSelection, delete: deleteWorkspace } = useWorkspace();
  const { selectedFile, selectFile } = useTreeStore();

  const selectWorkspace = useCallback(
    async (workspace: Workspace) => {
      await updateSelection(workspace);

      setVisibility(false);
    },
    [setVisibility, updateSelection],
  );

  useEffect(() => {
    if (!workspaces.length) {
      setVisibility(false);
    }
  }, [setVisibility, workspaces.length]);

  const workspaceDelete = useCallback(
    (workspaceUid: string) => {
      if (workspaceUid === selectedFile?.workspace_uid) {
        selectFile(undefined);
      }

      return deleteWorkspace(workspaceUid);
    },
    [deleteWorkspace, selectFile, selectedFile?.workspace_uid],
  );

  return (
    <Modal
      onClose={allowClosing ? () => setVisibility(false) : noop}
      easyClose={!!allowClosing}
    >
      <Wrapper>
        <Header>
          <WorkspaceSelectionMessage>
            Select a workspace
          </WorkspaceSelectionMessage>
          {onCreate && (
            <AddWorkspaceButton onClick={onCreate}>+</AddWorkspaceButton>
          )}
        </Header>
        <WorkspaceList>
          {workspaces.map((workspace) => {
            return (
              <WorkspaceListElement key={workspace.id}>
                <WorkspaceName
                  onClick={() => selectWorkspace(workspace as Workspace)}
                >
                  {workspace.name}
                </WorkspaceName>
                <div onClick={() => workspaceDelete(workspace.uid!)}>
                  <Trash width={22} height={22} stroke="#C6011F" />
                </div>
              </WorkspaceListElement>
            );
          })}
        </WorkspaceList>
      </Wrapper>
    </Modal>
  );
};

const WorkspaceName = styled.span`
  flex-grow: 1;
  align-self: center;
`;

const Wrapper = styled.div`
  width: 20vw;
  padding: 1vh 0;
`;

const WorkspaceSelectionMessage = styled.div`
  text-align: left;
  font-size: 1.1rem;
  font-weight: 600;
  align-self: center;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 2vh 0.9vw;
`;

const AddWorkspaceButton = styled.button`
  font-size: 1em;
  padding: 0.5em 1em;
  border-color: #646cff;
`;

const WorkspaceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1vh;
  flex-grow: 1;
  align-items: center;
  justify-content: flex-start;
`;

const WorkspaceListElement = styled.div`
  background-color: rgb(32, 33, 35);
  padding: 0.5em;
  width: 90%;
  cursor: pointer;
  text-align: left;
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  vertical-align: middle;
`;
