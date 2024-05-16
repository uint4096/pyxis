import { useCallback, useState } from "react";
import { TextInput } from "../../../input";
import { Modal } from "../../../modal";
import "./workspace.css";
import { save_config } from "../../../../ffi";
import { StoreConfig, WorkspaceBase, WorkspaceConfig } from "../../types";
import { nanoid } from "nanoid";

type WorkspaceSelectionProps = {
  storeConfig: StoreConfig | undefined;
  pathToStore: string;
  onCreate: (createdWorkspace: WorkspaceBase) => void;
};

export const CreateWorkspace = ({
  storeConfig,
  pathToStore,
  onCreate,
}: WorkspaceSelectionProps) => {
  const [name, setName] = useState("");

  const onWorkspaceCreation = useCallback(
    async (
      name: string,
      currentStoreConfig: StoreConfig | undefined,
      pathToStore: string
    ) => {
      const workspaceId = nanoid(10);
      const currentWorkspace = { id: workspaceId, name };
      const workspaceConfig: WorkspaceConfig = {
        ...currentWorkspace,
        tree: [],
        users_allowed_read: [],
        users_allowed_write: [],
      };

      const storeConfig: StoreConfig = {
        workspaces: [
          ...(currentStoreConfig?.workspaces ?? []),
          currentWorkspace,
        ],
        last_selected_workspace: currentWorkspace,
      };

      await Promise.all([
        save_config("write_store_config", {
          path: pathToStore,
          config: storeConfig,
        }),
        save_config("write_workspace_config", {
          path: `${pathToStore}/${name}`,
          config: workspaceConfig,
        }),
      ]);

      onCreate(currentWorkspace);
    },
    []
  );

  const body = (
    <div className="ws-form-wrapper">
      <TextInput
        value={name}
        placeholder="Path to workspaces..."
        size="medium"
        onChange={setName}
        message="Select a directory to store your workspaces"
      />
    </div>
  );

  const footer = (
    <div className="ws-form-footer">
      <button
        onClick={() => onWorkspaceCreation(name, storeConfig, pathToStore)}
      >
        Create
      </button>
    </div>
  );

  return (
    <div className="ws-form-container">
      <Modal body={body} size="small" footer={footer} />
    </div>
  );
};
