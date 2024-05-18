import "./no-workspace.css";

export type WorkspaceMessageProps = {
  onCreate: () => void;
};

export const NoWorkspaceMessage = ({ onCreate }: WorkspaceMessageProps) => {
  return (
    <div className="message-wrapper">
      <span className="workspace-message">You have no workspaces!</span>
      <button onClick={onCreate}>Create a Workspace</button>
    </div>
  );
};
