import { useCallback, useEffect, useState } from "react";
import Editor from "../editor/editor";
import {
  read_store_config,
  read_system_config,
  read_workspace_config,
} from "../../ffi";
import { StoreConfig, SystemConfig, WorkspaceBase, WorkspaceConfig } from "./types";
import "./explorer.css";
import { StoreForm } from "./forms/store";
import { NoWorkspaceMessage } from "./no-workspace";
import { CreateWorkspace } from "./forms/workspace";

export const Explorer = () => {
  const [showEditor, setEditor] = useState<boolean>(false);
  const [showStoreForm, setStoreForm] = useState<boolean>(false);
  const [noWorkspaces, setNoWorkspaces] = useState<boolean>(false);
  const [showWorkspaceForm, setWorkspaceForm] = useState<boolean>(false);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>();
  const [storeConfig, setStoreConfig] = useState<StoreConfig>();
  const [workspaceConfig, setWorkspaceConfig] = useState<WorkspaceConfig>();

  const onWorkspaceCreation = useCallback((currentWorkspace: WorkspaceBase) => {
    if (noWorkspaces) {
      setNoWorkspaces(false);
    }

    setStoreConfig((storeConfig) => ({
      workspaces: [...(storeConfig?.workspaces ?? []), currentWorkspace],
      selected_workspace: currentWorkspace
    }));

    setWorkspaceForm(false);
    setEditor(true);
  }, [noWorkspaces]);

  const onSaveSystemConfig = useCallback((systemConfig: SystemConfig) => {
    setSystemConfig(systemConfig);
  }, []);

  useEffect(() => {
    (async () => {
      const systemConfig = await read_system_config<SystemConfig>({} as never);

      if (!systemConfig || !systemConfig.store) {
        setStoreForm(true);
        return;
      }

      setSystemConfig(systemConfig);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!systemConfig) {
        return;
      }

      const storeConfig = await read_store_config<StoreConfig>({
        path: systemConfig.store,
      });

      if (
        !storeConfig ||
        !storeConfig.workspaces ||
        storeConfig.workspaces.length === 0
      ) {
        setNoWorkspaces(true);
        return;
      }

      setStoreConfig(storeConfig);
    })();
  }, [systemConfig]);

  useEffect(() => {
    (async () => {
      if (!storeConfig || !storeConfig.workspaces?.length || !systemConfig) {
        return;
      }

      if (!storeConfig.selected_workspace) {
        // Show worksapces modal
        // Corrupted workspace? @todo: How can we handle this?
        return;
      }

      const workspaceConfig = await read_workspace_config<WorkspaceConfig>({
        path: `${systemConfig.store}/${storeConfig.selected_workspace.name}`,
      });

      if (!workspaceConfig) {
        // Corrupted workspace? @todo: How can we handle this?
        return;
      }

      setWorkspaceConfig(workspaceConfig);
      setEditor(true);
    })();
  }, [storeConfig, systemConfig]);

  return (
    <div className="explorer">
      {showEditor && !noWorkspaces && <Editor />}
      {noWorkspaces && (
        <NoWorkspaceMessage onCreate={() => setWorkspaceForm(true)} />
      )}
      {showStoreForm && <StoreForm setVisibility={setStoreForm} onCreate={onSaveSystemConfig} />}
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
