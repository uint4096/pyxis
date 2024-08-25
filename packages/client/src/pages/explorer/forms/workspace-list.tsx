import { styled } from "@linaria/react";
import { useCallback } from "react";
import { Modal } from "../../../components";
import { FormWrapper } from "./common";
import { Workspace } from "../../../ffi";
import { useWorkspace } from "../../../store";

type WorkspaceListProps = {
  workspaces: Array<Partial<Workspace>>;
  setVisibility: React.Dispatch<React.SetStateAction<boolean>>;
};

export const WorkspaceSelection = ({
  workspaces,
  setVisibility,
}: WorkspaceListProps) => {
  const { updateSelection } = useWorkspace();

  const selectWorkspace = useCallback(
    async (workspace: Workspace) => {
      await updateSelection(workspace);

      setVisibility(false);
    },
    [setVisibility, updateSelection],
  );

  const label = (
    <WorkspaceSelectionMessage>Select a workspace</WorkspaceSelectionMessage>
  );

  const list = (
    <WorkspaceList>
      {workspaces.map((workspace) => {
        return (
          <WorkspaceListElement
            onClick={() => selectWorkspace(workspace as Workspace)}
            key={workspace.id}
          >
            {workspace.name}
          </WorkspaceListElement>
        );
      })}
    </WorkspaceList>
  );

  return (
    <FormWrapper>
      <Modal header={label} body={list} size="medium" />
    </FormWrapper>
  );
};

const WorkspaceSelectionMessage = styled.div`
  text-align: left;
  font-size: 1.5em;
  font-weight: 600;
  padding-left: 0.5vw;
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
`;
