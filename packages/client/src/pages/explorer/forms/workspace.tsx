import { styled } from "@linaria/react";
import { useCallback, useState } from "react";

import { TextInput } from "../../../components/input";
import { Modal } from "../../../components/modal";
import {
  StoreConfig,
  WorkspaceBase,
  WorkspaceConfig,
} from "../../../store/types";
import { nanoid } from "nanoid";
import { FormWrapper } from "./common";
import { useWorkspace } from "../../../store/useWorkspace";
import { useStore } from "../../../store/useStore";

type WorkspaceSelectionProps = {
  storeConfig: Partial<StoreConfig> | undefined;
  onCreate: (createdWorkspace: WorkspaceBase) => void;
};

export const CreateWorkspace = ({ onCreate }: WorkspaceSelectionProps) => {
  const [name, setName] = useState("");
  const { saveToDisk: saveWorkspaceConfig } = useWorkspace();
  const { updateWorkspace } = useStore();

  const onWorkspaceCreation = useCallback(
    async (name: string) => {
      const workspaceId = nanoid(10);
      const currentWorkspace = { id: workspaceId, name };
      const workspaceConfig: WorkspaceConfig = {
        ...currentWorkspace,
        tree: [],
        users_allowed_read: [],
        users_allowed_write: [],
      };

      await Promise.all([
        updateWorkspace(currentWorkspace),
        saveWorkspaceConfig(workspaceConfig),
      ]);

      onCreate(currentWorkspace);
    },
    [onCreate, saveWorkspaceConfig, updateWorkspace],
  );

  const body = (
    <div>
      <TextInput
        value={name}
        placeholder="Workspace Name"
        size="medium"
        onChange={setName}
        message="Select a name for your workspace"
      />
    </div>
  );

  const footer = (
    <FormFooter>
      <button onClick={() => onWorkspaceCreation(name)}>Create</button>
    </FormFooter>
  );

  return (
    <FormWrapper>
      <FormContainer>
        <Modal body={body} size="small" footer={footer} />
      </FormContainer>
    </FormWrapper>
  );
};

const FormContainer = styled.div`
  width: 20vw;
  height: 10vw;
  position: fixed;
`;

const FormFooter = styled.div`
  display: flex;
  justify-content: flex-end;
`;
