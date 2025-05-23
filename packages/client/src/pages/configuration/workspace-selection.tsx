import { useCallback, useEffect, useState } from "react";
import { Option } from "./wrappers";
import { useWorkspace } from "../../store";
import { CreateWorkspaceForm, WorkspaceSelection } from "../explorer/forms";
import { FaFolderTree } from "react-icons/fa6";

export const Workspaces = () => {
  const [showSelectDialog, setSelectDialog] = useState(false);
  const [showCreateDialog, setCreateDialog] = useState(false);

  const { workspaces, currentWorkspace } = useWorkspace();

  const onWorkspaceCreate = useCallback(() => {
    setSelectDialog(false);
    setCreateDialog(true);
  }, []);

  useEffect(() => {
    if (!workspaces.length) {
      setSelectDialog(false);
    }
  }, [workspaces.length]);

  return (
    <>
      {showSelectDialog && currentWorkspace?.uid && (
        <WorkspaceSelection
          workspaces={workspaces}
          setVisibility={setSelectDialog}
          allowClosing={true}
          onCreate={onWorkspaceCreate}
        />
      )}
      {showCreateDialog && (
        <CreateWorkspaceForm
          onDone={() => {
            setCreateDialog(false);
            setSelectDialog(true);
          }}
        />
      )}
      <Option
        icon={<FaFolderTree size={18} />}
        onClick={() => workspaces.length && setSelectDialog(true)}
      />
    </>
  );
};
