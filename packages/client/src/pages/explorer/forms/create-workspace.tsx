import { styled } from "@linaria/react";
import { Modal, TextInput } from "../../../components";
import { useCallback, useState } from "react";
import { useWorkspace } from "../../../store";

type CreateWorkspaceProps = {
  onDone: () => void;
  onClose?: () => void;
};

export const CreateWorkspaceForm = ({
  onDone,
  onClose,
}: CreateWorkspaceProps) => {
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
    <Modal onClose={onClose ?? onDone} easyClose={true}>
      <Wrapper>
        <InputContainer>
          <span>Pick a name for your workspace</span>
          <TextInput
            value={name}
            placeholder="Workspace Name"
            size="medium"
            onChange={setName}
          />
        </InputContainer>
        <CreateWorkspaceButton onClick={() => onWorkspaceCreation(name)}>
          Create
        </CreateWorkspaceButton>
      </Wrapper>
    </Modal>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2em;
  justify-content: center;
  width: 15vw;
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  justify-content: flex-start;
  gap: 1vh;
  font-weight: 600;
`;

const CreateWorkspaceButton = styled.button`
  font-size: 0.8em;
  width: 50%;
  font-weight: 500;
  background-color: #646cff;
`;
