export type WorkspaceBase = {
  id: string;
  name: string;
};

export type StoreConfig = {
  workspaces: Array<WorkspaceBase>;
  last_selected_workspace: WorkspaceBase;
};

type Entity = string | { [k: string]: Array<Entity> };

export type WorkspaceConfig = {
  id: string;
  name: string;
  users_allowed_read: Array<string>;
  users_allowed_write: Array<string>;
  tree: Array<Entity>;
};

export type SystemConfig = {
  username: string;
  organization: string;
  store: string;
};
