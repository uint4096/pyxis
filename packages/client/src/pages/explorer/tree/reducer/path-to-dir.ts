import type { DirEntity } from "../../../../types";
import { isFile } from "../guards";
import type { WorkspaceConfig } from "../../types";

export const pathToDir = (
  id: string,
  tree: WorkspaceConfig["tree"],
  path = "",
): { filePath: string; found: boolean } =>
  tree
    .filter((t) => !isFile(t))
    .reduce(
      ({ filePath, found }, content) => {
        if (found) {
          return { filePath, found };
        }

        const dir = content as DirEntity;
        if (dir.Dir.id === id) {
          return { filePath: `${path}/${dir.Dir.name}`, found: true };
        }

        return pathToDir(id, dir.Dir.content, `${path}/${dir.Dir.name}`);
      },
      { filePath: "", found: false as boolean },
    );
