import { styled } from "@linaria/react";
import { useCallback, useState } from "react";

import { Modal, TextInput } from "../../../components";
import { FormWrapper } from "./common";
import { useWorkspace } from "../../../store";

type WorkspaceSelectionProps = {
  setVisibility: React.Dispatch<React.SetStateAction<boolean>>;
};

export const CreateWorkspace = ({ setVisibility }: WorkspaceSelectionProps) => {
  const [name, setName] = useState("");
  const [showForm, setForm] = useState(false);

  const { create } = useWorkspace();

  const onWorkspaceCreation = useCallback(
    async (name: string) => {
      const workspace = await create(name);

      if (!workspace) {
        return;
      }

      setVisibility(false);
    },
    [create, setVisibility],
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
    <>
      {!showForm && (
        <FormWrapper>
          <MessageWrapper>
            <WorkspaceMessage>You have no workspaces!</WorkspaceMessage>
            <button onClick={() => setForm(true)}>Create a Workspace</button>
          </MessageWrapper>
        </FormWrapper>
      )}
      {showForm && (
        <FormWrapper>
          <FormContainer>
            <Modal body={body} size="small" footer={footer} />
          </FormContainer>
        </FormWrapper>
      )}
    </>
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

const MessageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1vh;
`;

const WorkspaceMessage = styled.span`
  font-weight: 600;
`;
