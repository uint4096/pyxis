export type WorkspaceBase = {
  id: string;
  name: string;
};

export type StoreConfig = {
  workspaces: Array<WorkspaceBase>;
  selected_workspace?: WorkspaceBase;
};

export type File = { [k in 'File']: string; };
export type Directory = { [k in 'Dir']: [ string, Array<Entity> ] }; 
export type Entity = File | Directory;

export type WorkspaceConfig = {
  id: string;
  name: string;
  users_allowed_read: Array<string>;
  users_allowed_write: Array<string>;
  tree: Array<Entity>;
};

export type SystemConfig = {
  store: string;
};

export type ArrayElement<T> = T extends Array<infer X> ? X : never;
