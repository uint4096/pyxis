import type { WorkspaceConfig } from "../../types";
import type { Directory, File, Document } from "../../../../types";
import { updateTree } from "./utils/update-tree";
import { deleteFromTree } from "./utils/delete-from-tree";

export type Actions = "create" | "delete";
type State = WorkspaceConfig | undefined;

export type ReducerArgs<T extends Document> = [
  targetId: string,
  entityType: T,
  entity: T extends "file" ? File : Directory,
];

export type ReducerAction<T extends Document> = {
  type: Actions;
  args: ReducerArgs<T>;
};

type Handlers = {
  [k in Actions]: <T extends Document>(
    state: NonNullable<State>,
    ...args: ReducerArgs<T>
  ) => WorkspaceConfig;
};

/*
 * @todo: both handlers should be rewritten to use the `path` property
 * within the entity itself instead of using the `targetId`.
 */

const createHandler: Handlers["create"] = (
  workspace,
  targetId,
  entityType,
  entity,
) => {
  const { id, name: workspaceName, tree } = workspace;
  const computeTree = updateTree(
    { id, name: workspaceName, content: tree, path: "" },
    targetId,
  );

  return {
    ...workspace,
    tree: computeTree(entityType, entity),
  };
};

const deleteHandler: Handlers["delete"] = (
  workspace,
  targetId,
  entityType,
  entity,
) => {
  const { id, name: workspaceName, tree } = workspace;
  const computeTree = deleteFromTree(
    { id, name: workspaceName, content: tree, path: "" },
    targetId,
  );

  return {
    ...workspace,
    tree: computeTree(entityType, entity),
  };
};

const handlers: Handlers = {
  create: createHandler,
  delete: deleteHandler,
};

export const reducer =
  <T extends Document>() =>
  (state: State, action: ReducerAction<T>) => {
    if (!state) {
      return;
    }

    return handlers[action.type](state, ...action.args);
  };
