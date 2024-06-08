import { useCallback, useContext, useEffect, useReducer } from "react";
import {
  type Actions,
  type ReducerArgs,
  reducer,
} from "./reducers/tree.reducer";
import type { Directory, Document, Entity, File } from "../../../types";
import { pathToDir } from "./reducers/utils/path-to-dir";
import {
  createFile,
  createDir,
  deleteFile,
  deleteDir,
  saveWorkspaceConfig,
} from "../../../ffi";
import { ConfigContext, TConfigContext } from "../index";

type UseWorkspaceProps = {
  refreshTree: (tree: Array<Entity>) => void;
};

type WorkspaceActions = {
  file: (arg: { file: File; path: string }) => Promise<boolean>;
  dir: (arg: { dir: Directory; path: string }) => Promise<boolean>;
};

type ActionArgs<T extends Document> = {
  action: Actions;
  type: T;
  actions: WorkspaceActions;
};

export const useWorkspace = ({ refreshTree }: UseWorkspaceProps) => {
  /**
   * @todo: consider moving to React 19 once it's out and use a combination of
   * useTransition and useOptimistic along with the reducer here.
   */
  const { workspaceConfig, workspacePath } =
    useContext<TConfigContext>(ConfigContext);

  const [wsConfig, dispatch] = useReducer<ReturnType<typeof reducer>>(
    reducer(),
    workspaceConfig,
  );

  const actionHandler = useCallback(
    <T extends Document>({
      action,
      type,
      actions: { dir: dirHandler, file: fileHandler },
    }: ActionArgs<T>) =>
      async (targetId: string, entity: T extends "file" ? File : Directory) => {
        const args =
          type === "file"
            ? ([targetId, "file", entity] as ReducerArgs<"file">)
            : ([targetId, "dir", entity] as ReducerArgs<"dir">);

        if (!wsConfig) {
          return;
        }

        const response =
          type === "file"
            ? await fileHandler({
                file: entity as File,
                path: `${workspacePath}${entity.path}`,
              })
            : await dirHandler({
                dir: entity as Directory,
                path: `${workspacePath}${entity.path}`,
              });

        if (!response) {
          //@todo: Handle error and show toast message
          return;
        }

        dispatch({ type: action, args });
      },
    [wsConfig, workspacePath],
  );

  useEffect(() => {
    (async () => {
      if (!wsConfig) {
        return;
      }

      if (
        !(await saveWorkspaceConfig({
          path: workspacePath,
          config: { ...wsConfig },
        }))
      ) {
        //@todo: Handle error and show toast message
        return;
      }

      refreshTree(wsConfig.tree);
    })();
  }, [refreshTree, workspacePath, wsConfig]);

  const onCreateFile = actionHandler({
    action: "create",
    type: "file",
    actions: { dir: createDir, file: createFile },
  });

  const onCreateDir = actionHandler({
    action: "create",
    type: "dir",
    actions: { dir: createDir, file: createFile },
  });

  const onDeleteFile = actionHandler({
    action: "delete",
    type: "file",
    actions: { dir: deleteDir, file: deleteFile },
  });

  const onDeleteDir = actionHandler({
    action: "delete",
    type: "dir",
    actions: { dir: deleteDir, file: deleteFile },
  });

  return {
    config: wsConfig,
    handlers: {
      onCreateFile,
      onCreateDir,
      onDeleteFile,
      onDeleteDir,
    },
  };
};
