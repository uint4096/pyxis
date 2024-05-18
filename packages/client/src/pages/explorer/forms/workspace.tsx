import { styled } from "@linaria/react";
import { useCallback, useState } from "react";

import { TextInput } from "../../../components/input";
import { Modal } from "../../../components/modal";
import { save_config } from "../../../ffi";
import { StoreConfig, WorkspaceBase, WorkspaceConfig } from "../types";
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
      <button
        onClick={() => onWorkspaceCreation(name, storeConfig, pathToStore)}
      >
        Create
      </button>
    </FormFooter>
  );

  return (
    <FormContainer>
      <Modal body={body} size="small" footer={footer} />
    </FormContainer>
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
