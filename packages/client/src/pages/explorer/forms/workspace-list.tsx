import { styled } from "@linaria/react";
import { useCallback } from "react";
import { Modal } from "../../../components/modal";
import type { ArrayElement, StoreConfig, SystemConfig } from "../../../store/types";
import { saveStoreConfig } from "../../../ffi";
import { FormWrapper } from "./common";

type WorkspaceElement = ArrayElement<StoreConfig["workspaces"]>;

type WorkspaceListProps = {
  store: SystemConfig["store"];
  workspaces: StoreConfig["workspaces"];
  onSelect: (workspace: WorkspaceElement) => void;
};

export const WorkspaceSelection = ({
  store,
  workspaces,
  onSelect,
}: WorkspaceListProps) => {
  const selectWorkspace = useCallback(
    async (workspace: WorkspaceElement) => {
      await saveStoreConfig<StoreConfig>({
        path: store,
        config: {
          workspaces,
          selected_workspace: workspace,
        },
      });

      onSelect(workspace);
    },
    [onSelect, store, workspaces],
  );

  const label = (
    <WorkspaceSelectionMessage>Select a workspace</WorkspaceSelectionMessage>
  );

  const list = (
    <WorkspaceList>
      {workspaces.map((workspace) => {
        return (
          <WorkspaceListElement
            onClick={() => selectWorkspace(workspace)}
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
