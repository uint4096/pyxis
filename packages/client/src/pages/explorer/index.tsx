import { useEffect, useState } from "react";
import Editor from "../editor/editor";
import {
  read_store_config,
  read_system_config,
  read_workspace_config,
} from "../../ffi";
import { StoreConfig, SystemConfig, WorkspaceBase } from "./types";
import "./explorer.css";
import { StoreForm } from "./forms/store";
import { NoWorkspaceMessage } from "./no-workspace";
import { CreateWorkspace } from "./forms/workspace";

export const Explorer = () => {
  const [showEditor, setEditor] = useState<boolean>(false);
  const [showStoreForm, setStoreForm] = useState<boolean>(false);
  const [workspaces, setWorkspaces] = useState<
    Array<WorkspaceBase & { selected?: boolean }>
  >([]);
  const [noWorkspaces, setNoWorkspaces] = useState<boolean>(false);
  const [showWorkspaceForm, setWorkspaceForm] = useState<boolean>(false);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>();
  const [storeConfig, setStoreConfig] = useState<StoreConfig>();

  const onWorkspaceCreation = (currentWorkspace: WorkspaceBase) => {
    if (noWorkspaces) {
      setNoWorkspaces(false);
    }

    setWorkspaces((workspaces) => [
      ...workspaces,
      { ...currentWorkspace, selected: true },
    ]);
    setWorkspaceForm(false);
    setEditor(true);
  };

  useEffect(() => {
    (async () => {
      const systemConfig = await read_system_config<SystemConfig>({} as never);

      if (!systemConfig || !systemConfig.store) {
        setStoreForm(true);
        return;
      }

      setSystemConfig(systemConfig);

      const storeConfig = await read_store_config<StoreConfig>({
        path: systemConfig.store,
      });

      if (
        !storeConfig ||
        !storeConfig.workspaces ||
        storeConfig.workspaces.length === 0
      ) {
        //Show workspaces Modal
        setNoWorkspaces(true);
        return;
      }

      setStoreConfig(storeConfig);

      if (!storeConfig.last_selected_workspace) {
        return;
      }

      const workspaceConfig = await read_workspace_config({
        path: `${systemConfig.store}/${storeConfig.last_selected_workspace.name}`,
      });

      if (!workspaceConfig) {
        // Show worksapces modal
        // Corrupted workspace? @todo: How can we handle this?
        return;
      }

      setEditor(true);
    })();
  }, []);

  return (
    <div className="explorer">
      {showEditor && !noWorkspaces && <Editor />}
      {noWorkspaces && (
        <NoWorkspaceMessage onCreate={() => setWorkspaceForm(true)} />
      )}
      {showStoreForm && <StoreForm setVisibility={setStoreForm} />}
      {systemConfig && showWorkspaceForm && (
        <CreateWorkspace
          onCreate={onWorkspaceCreation}
          pathToStore={systemConfig.store}
          storeConfig={storeConfig}
        />
      )}
    </div>
  );
};
