import type { Directory, File, Entity } from "../../../../../types";
import { PATH_SEPARATOR } from "../../../../../utils";
import { isFile, isFileEntity } from "../../../../tree/guards";
import { WorkspaceConfig } from "../../../types";

export const deleteFromTree =
  (workspaceConfig: Partial<WorkspaceConfig>) =>
  (entity: File | Directory): Array<Entity> => {
    const filterEntity = (e: Entity) => {
      if (isFile(entity) && isFileEntity(e) && e.File.name === entity.name) {
        return false;
      }

      if (
        !isFile(entity) &&
        !isFileEntity(e) &&
        e.Dir.id === (entity as Directory).id
      ) {
        return false;
      }

      return true;
    };

    const recursivelyUpdate = (
      tree: Array<Entity>,
      path: Array<string>,
    ): Array<Entity> => {
      return tree.map((e) => {
        if (isFileEntity(e) || e.Dir.name !== path[0]) {
          return e;
        }

        if (path.length === 1) {
          return {
            Dir: {
              ...e.Dir,
              content: e.Dir.content.filter((c) => filterEntity(c)),
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
      ? (workspaceConfig.tree ?? []).filter((c) => filterEntity(c))
      : recursivelyUpdate(workspaceConfig.tree ?? [], pathToEntity);
  };
