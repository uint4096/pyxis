import { styled } from "@linaria/react";
import { useCallback, useEffect, useState } from "react";
import Editor from "../editor/editor";
import {
  readStoreConfig,
  readSystemConfig,
  readWorkspaceConfig,
  read_dir_tree,
  saveWorkspaceConfig,
} from "../../ffi";
import {
  StoreConfig,
  SystemConfig,
  WorkspaceBase,
  WorkspaceConfig,
} from "./types";
import { StoreForm } from "./forms/store";
import { NoWorkspaceMessage } from "./forms/no-workspace";
import { CreateWorkspace } from "./forms/workspace";
import { WorkspaceSelection } from "./forms/workspace-list";
import { Tree } from "./tree";
import { Entity } from "../../types";

export const Explorer = () => {
  const [showStoreForm, setStoreForm] = useState<boolean>(false);
  const [showWorkspaceForm, setWorkspaceForm] = useState<boolean>(false);
  const [showWorkspaceSelectionForm, setWorkspaceSelectionForm] =
    useState<boolean>(false);
  const [noWorkspaces, setNoWorkspaces] = useState<boolean>(false);

  const [systemConfig, setSystemConfig] = useState<SystemConfig>();
  const [storeConfig, setStoreConfig] = useState<StoreConfig>();
  const [workspaceConfig, setWorkspaceConfig] = useState<WorkspaceConfig>();

  const [showEditor, setEditor] = useState<boolean>(false);

  const onWorkspaceCreation = useCallback(
    (currentWorkspace: WorkspaceBase) => {
      if (noWorkspaces) {
        setNoWorkspaces(false);
      }

      setStoreConfig((storeConfig) => ({
        workspaces: [...(storeConfig?.workspaces ?? []), currentWorkspace],
        selected_workspace: currentWorkspace,
      }));

      setWorkspaceForm(false);
      setEditor(true);
    },
    [noWorkspaces]
  );

  const onSaveSystemConfig = useCallback((systemConfig: SystemConfig) => {
    setSystemConfig(systemConfig);
    setStoreForm(false);
  }, []);

  const onWorkspaceSelection = useCallback((workspace: WorkspaceBase) => {
    setStoreConfig((storeConfig) => ({
      workspaces: [...(storeConfig?.workspaces ?? [])],
      selected_workspace: workspace,
    }));
    setWorkspaceSelectionForm(false);
  }, []);

  const refreshTree = useCallback(
    (tree: Array<Entity>) => {
      if (!systemConfig || !storeConfig || !storeConfig.selected_workspace) {
        return;
      }

      setWorkspaceConfig((config) => {
        if (!config) {
          return undefined;
        }

        return {
          ...config,
          tree,
        };
      });
    },
    [systemConfig, storeConfig]
  );

  useEffect(() => {
    // Save workspace config to disk
    if (
      !systemConfig ||
      !workspaceConfig ||
      !storeConfig ||
      !storeConfig.selected_workspace
    ) {
      return;
    }

    const workspacePath = `${systemConfig.store}/${storeConfig.selected_workspace.name}`;

    (async () =>
      await saveWorkspaceConfig({
        path: workspacePath,
        config: { ...workspaceConfig },
      }))();
  }, [workspaceConfig]);

  useEffect(() => {
    (async () => {
      const systemConfig = await readSystemConfig<SystemConfig>({} as never);

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

      const storeConfig = await readStoreConfig<StoreConfig>({
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
        setWorkspaceSelectionForm(true);

        // Corrupted workspace? @todo: How can we handle this?
        return;
      }

      const workspacePath = `${systemConfig.store}/${storeConfig.selected_workspace.name}`;
      const workspaceConfig = await readWorkspaceConfig<WorkspaceConfig>({
        path: workspacePath,
      });

      if (!workspaceConfig) {
        // Corrupted workspace? @todo: How can we handle this?
        return;
      }

      if (!workspaceConfig.tree || workspaceConfig.tree.length === 0) {
        const tree = (await read_dir_tree(workspacePath)) ?? [];
        setWorkspaceConfig({ ...workspaceConfig, tree });
      } else {
        setWorkspaceConfig({ ...workspaceConfig });
      }

      setEditor(true);
    })();
  }, [storeConfig, systemConfig]);

  return (
    <ExplorerWrapper>
      {workspaceConfig?.tree && systemConfig && (
        <Tree
          workspace={workspaceConfig}
          store={systemConfig.store}
          refreshTree={refreshTree}
        />
      )}
      {showEditor && !noWorkspaces && <Editor />}
      {noWorkspaces && (
        <NoWorkspaceMessage onCreate={() => setWorkspaceForm(true)} />
      )}
      {showStoreForm && <StoreForm onCreate={onSaveSystemConfig} />}
      {systemConfig && showWorkspaceForm && (
        <CreateWorkspace
          onCreate={onWorkspaceCreation}
          pathToStore={systemConfig.store}
          storeConfig={storeConfig}
        />
      )}
      {showWorkspaceSelectionForm &&
        storeConfig &&
        systemConfig?.store &&
        storeConfig.workspaces.length > 0 && (
          <WorkspaceSelection
            store={systemConfig.store}
            workspaces={storeConfig.workspaces}
            onSelect={onWorkspaceSelection}
          />
        )}
    </ExplorerWrapper>
  );
};

const ExplorerWrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 7vh 5vw;
  height: 100%;
  flex-grow: 1;
  gap: 10vw;
`;
