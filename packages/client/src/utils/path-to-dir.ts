import type { DirEntity } from "../types";
import { isFileEntity } from "./guards";
import type { WorkspaceConfig } from "../store/types";

export const pathToDir = (
  id: string,
  tree: WorkspaceConfig["tree"] = [],
  initalPath = "",
): { path: string; found: boolean } =>
  tree
    .filter((t) => !isFileEntity(t))
    .reduce(
      ({ path, found }, content) => {
        if (found) {
          return { path, found };
        }

        const dir = content as DirEntity;
        if (dir.Dir.id === id) {
          return { path: `${path}/${dir.Dir.name}`, found: true };
        }

        return pathToDir(id, dir.Dir.content, `${path}/${dir.Dir.name}`);
      },
      { path: initalPath, found: false as boolean },
    );
