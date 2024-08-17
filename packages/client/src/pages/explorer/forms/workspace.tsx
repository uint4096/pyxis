import { styled } from "@linaria/react";
import { useCallback, useState } from "react";

import { TextInput } from "../../../components/input";
import { Modal } from "../../../components/modal";
import { FormWrapper } from "./common";
import { useWorkspace } from "../../../store/use-workspace";
import { Workspace } from "../../../ffi";

type WorkspaceSelectionProps = {
  onCreate: (createdWorkspace: Workspace) => void;
};

export const CreateWorkspace = ({ onCreate }: WorkspaceSelectionProps) => {
  const [name, setName] = useState("");
  const { create } = useWorkspace();

  const onWorkspaceCreation = useCallback(
    async (name: string) => {
      const workspace = await create(name);

      if (!workspace) {
        return;
      }

      onCreate(workspace);
    },
    [create, onCreate],
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
