import type { DirEntity } from "../../../../../types";
import { isFile } from "../../../tree/guards";
import type { WorkspaceConfig } from "../../../types";

export const pathToDir = (
  id: string,
  tree: WorkspaceConfig["tree"],
  initalPath = "",
): { path: string; found: boolean } =>
  tree
    .filter((t) => !isFile(t))
    .reduce(
      ({ path, found }, content) => {
        if (found) {
          return { path, found };
        }

        const dir = content as DirEntity;
        if (dir.Dir.id === id) {
          return { path: `${initalPath}/${dir.Dir.name}`, found: true };
        }

        return pathToDir(id, dir.Dir.content, `${initalPath}/${dir.Dir.name}`);
      },
      { path: "", found: false as boolean },
    );
