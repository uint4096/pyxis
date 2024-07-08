import type {
  Directory,
  File,
  Entity,
  Document,
  FileEntity,
  DirEntity,
} from "../../../../../types";
import { PATH_SEPARATOR } from "../../../../../utils";
import { isFile } from "../../../../tree/guards";
import type { WorkspaceConfig } from "../../../types";

export const updateTree =
  (workspaceConfig: WorkspaceConfig) =>
  (type: Document, entity: File | Directory): Array<Entity> => {
    const addition =
      type === "file"
        ? ({ File: entity } as FileEntity)
        : ({ Dir: entity } as DirEntity);

    const recursivelyUpdate = (
      tree: Array<Entity>,
      path: Array<string>,
    ): Array<Entity> => {
      return tree.map((e) => {
        if (isFile(e) || e.Dir.name !== path[0]) {
          return e;
        }

        if (path.length === 1) {
          return {
            Dir: {
              ...e.Dir,
              content: [addition, ...e.Dir.content],
            },
          };
        }

        return {
          Dir: {
            ...e.Dir,
            content: recursivelyUpdate(e.Dir.content, path.slice(1)),
          },
        };
      });
    };

    const pathToEntity = entity.path.split(PATH_SEPARATOR).slice(1, -1);

    return pathToEntity.length === 0
      ? [addition, ...workspaceConfig.tree]
      : recursivelyUpdate(workspaceConfig.tree, pathToEntity);
  };
