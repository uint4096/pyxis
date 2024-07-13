import { styled } from "@linaria/react";
import { createContext, useCallback, useEffect, useState } from "react";
import Editor from "../editor/editor";
import { readWorkspaceConfig, read_dir_tree } from "../../ffi";
import type {
  StoreConfig,
  SystemConfig,
  WorkspaceConfig,
} from "../../store/types";
import { StoreForm } from "./forms/store";
import { NoWorkspaceMessage } from "./forms/no-workspace";
import { CreateWorkspace } from "./forms/workspace";
import { WorkspaceSelection } from "./forms/workspace-list";
import { Tree } from "../tree";
import { useWorkspace, useFile, useStore, useSystem } from "../../store";

export type TConfigContext = {
  storeConfig: StoreConfig;
  systemConfig: SystemConfig;
  workspacePath: string;
};

export const ConfigContext = createContext<TConfigContext>(
  {} as TConfigContext,
);

export const Explorer = () => {
  const {
    config: workspaceConfig,
    path: workspacePath,
    initConfig: initWorkspaceConfig,
  } = useWorkspace();
  const {
    config: storeConfig,
    readFromDisk: readStoreConfig,
    path: storePath,
  } = useStore();
  const { config: systemConfig, readFromDisk: readSystemConfig } = useSystem();
  const { file, content, saveToDisk: saveFileContent } = useFile();

  const [showStoreForm, setStoreForm] = useState<boolean>(false);
  const [showWorkspaceForm, setWorkspaceForm] = useState<boolean>(false);
  const [showWorkspaceSelectionForm, setWorkspaceSelectionForm] =
    useState<boolean>(false);
  const [noWorkspaces, setNoWorkspaces] = useState<boolean>(false);

  const [showEditor, setEditor] = useState<boolean>(false);

  const onWorkspaceCreation = useCallback(() => {
    if (noWorkspaces) {
      setNoWorkspaces(false);
    }

    setWorkspaceForm(false);
    setEditor(true);
  }, [noWorkspaces]);

  useEffect(() => {
    (async () => {
      const systemConfig = await readSystemConfig();

      if (!systemConfig || !systemConfig.store) {
        setStoreForm(true);
        return;
      }
    })();
  }, [readSystemConfig]);

  useEffect(() => {
    (async () => {
      if (!systemConfig || !systemConfig.store) {
        return;
      }

      const storeConfig = await readStoreConfig(systemConfig.store);

      if (
        !storeConfig ||
        !storeConfig.workspaces ||
        storeConfig.workspaces.length === 0
      ) {
        setNoWorkspaces(true);
        return;
      }
    })();
  }, [readStoreConfig, systemConfig]);

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

      const workspacePath = `${storePath}/${storeConfig.selected_workspace.name}`;
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
  }, [initWorkspaceConfig, storeConfig, storePath, systemConfig]);

  return (
    <ExplorerWrapper>
      {workspaceConfig && systemConfig && storeConfig?.selected_workspace && (
        <Tree />
      )}

      {showEditor && !noWorkspaces && file.name && workspacePath && (
        <Editor
          fileWithContent={{ ...file, content }}
          writer={saveFileContent(workspacePath)}
        />
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
