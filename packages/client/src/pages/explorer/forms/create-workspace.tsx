import { styled } from "@linaria/react";
import { FormWrapper } from "./common";
import { Modal, TextInput } from "../../../components";
import { useCallback, useState } from "react";
import { useWorkspace } from "../../../store";

type CreateWorkspaceProps = {
  onDone: () => void;
};

export const CreateWorkspaceForm = ({ onDone }: CreateWorkspaceProps) => {
  const [name, setName] = useState("");
  const { create } = useWorkspace();

  const onWorkspaceCreation = useCallback(
    async (name: string) => {
      const workspace = await create(name);

      if (!workspace) {
        return;
      }

      onDone?.();
    },
    [create, onDone],
  );

  return (
    <FormWrapper>
      <FormContainer>
        <Modal onClose={onDone} easyClose={false}>
          <div>
            <TextInput
              value={name}
              placeholder="Workspace Name"
              size="medium"
              onChange={setName}
              message="Select a name for your workspace"
            />
          </div>
          <FormFooter>
            <button onClick={() => onWorkspaceCreation(name)}>Create</button>
          </FormFooter>
        </Modal>
      </FormContainer>
    </FormWrapper>
  );
};

const FormFooter = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const FormContainer = styled.div`
  width: 20vw;
  height: 10vw;
  position: fixed;
`;
