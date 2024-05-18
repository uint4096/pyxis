import { styled } from "@linaria/react";

export type WorkspaceMessageProps = {
  onCreate: () => void;
};

export const NoWorkspaceMessage = ({ onCreate }: WorkspaceMessageProps) => {
  return (
    <MessageWrapper>
      <WorkspaceMessage>You have no workspaces!</WorkspaceMessage>
      <button onClick={onCreate}>Create a Workspace</button>
    </MessageWrapper>
  );
};

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
