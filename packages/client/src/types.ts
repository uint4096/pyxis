export type FileEntity = { [k in "File"]: string };
export type DirEntity = {
  [k in "Dir"]: { id: string; name: string; content: Array<Entity> };
};
export type Entity = FileEntity | DirEntity;

type Link = [string, string];

export type File = {
  name: string;
  title: string;
  tags: Array<string>;
  owned_by: string;
  whitelisted_groups: Array<string>;
  whitelisted_users: Array<string>;
  created_at: string;
  updated_at: string;
  links: Array<Link>;
};
