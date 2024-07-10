import { styled } from "@linaria/react";
import { createContext, useCallback, useEffect, useState } from "react";
import Editor from "../editor/editor";
import {
  readStoreConfig,
  readSystemConfig,
  readWorkspaceConfig,
  read_dir_tree,
} from "../../ffi";
import { StoreConfig, SystemConfig, WorkspaceConfig } from "../../store/types";
import { StoreForm } from "./forms/store";
import { NoWorkspaceMessage } from "./forms/no-workspace";
import { CreateWorkspace } from "./forms/workspace";
import { WorkspaceSelection } from "./forms/workspace-list";
import { Tree } from "../tree";
import { useFile } from "./hooks";
import { useWorkspace } from "../../store/useWorkspace";
import { useStore } from "../../store/useStore";
import { useSystem } from "../../store/useSystem";

export type TConfigContext = {
  storeConfig: StoreConfig;
  systemConfig: SystemConfig;
  workspacePath: string;
};

export const ConfigContext = createContext<TConfigContext>(
  {} as TConfigContext,
);

export const Explorer = () => {
  const { config: workspaceConfig, initConfig: initWorkspaceConfig } =
    useWorkspace();
  const { config: storeConfig, initConfig: initStoreConfig } = useStore();
  const { config: systemConfig, initConfig: initSystemConfig } = useSystem();

  const [showStoreForm, setStoreForm] = useState<boolean>(false);
  const [showWorkspaceForm, setWorkspaceForm] = useState<boolean>(false);
  const [showWorkspaceSelectionForm, setWorkspaceSelectionForm] =
    useState<boolean>(false);
  const [noWorkspaces, setNoWorkspaces] = useState<boolean>(false);

  const [showEditor, setEditor] = useState<boolean>(false);

  const { fileWithContent, readFromPath, writeToFile } = useFile({
    workspaceConfig,
  });

  const onWorkspaceCreation = useCallback(() => {
    if (noWorkspaces) {
      setNoWorkspaces(false);
    }

    setWorkspaceForm(false);
    setEditor(true);
  }, [noWorkspaces]);

  useEffect(() => {
    (async () => {
      const systemConfig = await readSystemConfig<SystemConfig>({} as never);

      if (!systemConfig || !systemConfig.store) {
        setStoreForm(true);
        return;
      }

      initSystemConfig(systemConfig);
    })();
  }, [initSystemConfig]);

  useEffect(() => {
    (async () => {
      if (!systemConfig || !systemConfig.store) {
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

      initStoreConfig(storeConfig, systemConfig.store);
    })();
  }, [initStoreConfig, systemConfig]);

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
        initWorkspaceConfig({ ...workspaceConfig, tree }, workspacePath);
      } else {
        initWorkspaceConfig({ ...workspaceConfig }, workspacePath);
      }

      setEditor(true);
    })();
  }, [initWorkspaceConfig, storeConfig, systemConfig]);

  /*
   * @todo: Wrap all configs in a Context here. This will prevent a lot
   * of prop drilling.
   */
  return (
    <ExplorerWrapper>
      {workspaceConfig && systemConfig && storeConfig?.selected_workspace && (
        <Tree readFile={readFromPath} />
      )}

      {showEditor && !noWorkspaces && fileWithContent.name && (
        <Editor fileWithContent={fileWithContent} writer={writeToFile} />
      )}

      {/* Modals and Forms */}
      {noWorkspaces && (
        <NoWorkspaceMessage onCreate={() => setWorkspaceForm(true)} />
      )}
      {showStoreForm && <StoreForm setVisibility={setStoreForm} />}
      {systemConfig && showWorkspaceForm && (
        <CreateWorkspace
          onCreate={onWorkspaceCreation}
          storeConfig={storeConfig}
        />
      )}
      {showWorkspaceSelectionForm &&
        storeConfig &&
        storeConfig.workspaces &&
        systemConfig?.store &&
        storeConfig.workspaces.length > 0 && (
          <WorkspaceSelection
            workspaces={storeConfig.workspaces}
            setVisibility={setWorkspaceSelectionForm}
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
  gap: 5vw;
`;
