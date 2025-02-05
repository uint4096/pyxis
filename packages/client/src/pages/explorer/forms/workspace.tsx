import { styled } from "@linaria/react";
import { useState } from "react";

import { CreateWorkspaceForm } from "./create-workspace";

type WorkspaceSelectionProps = {
  setVisibility: React.Dispatch<React.SetStateAction<boolean>>;
};

export const CreateWorkspace = ({ setVisibility }: WorkspaceSelectionProps) => {
  const [showForm, setForm] = useState(false);

  return (
    <>
      {!showForm && (
        <MessageWrapper>
          <WorkspaceMessage>You have no workspaces!</WorkspaceMessage>
          <button onClick={() => setForm(true)}>Create a Workspace</button>
        </MessageWrapper>
      )}
      {showForm && <CreateWorkspaceForm onDone={() => setVisibility(false)} />}
    </>
  );
};

const MessageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1vh;
  flex-grow: 1;
`;

const WorkspaceMessage = styled.span`
  font-weight: 600;
`;
