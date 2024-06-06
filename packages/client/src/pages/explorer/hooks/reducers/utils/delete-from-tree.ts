import type { Directory, Document, File, Entity } from "../../../../../types";
import { isFile } from "../../../tree/guards";

export const deleteFromTree =
  (dir: Omit<Directory, "path">, targetId: string) =>
  (type: Document, entity: File | Directory): Array<Entity> => {
    const filterEntity = (e: Entity) => {
      if (type === "file" && isFile(e) && e.File.name === entity.name) {
        return false;
      }

      if (
        type === "dir" &&
        !isFile(e) &&
        e.Dir.id === (entity as Directory).id
      ) {
        return false;
      }

      return true;
    };

    const recursivelyUpdate = (tree: Array<Entity>): Array<Entity> => {
      return tree.map((d) => {
        if (isFile(d)) {
          return d;
        }

        if (d.Dir.id === targetId) {
          return {
            Dir: {
              ...d.Dir,
              content: d.Dir.content.filter((c) => filterEntity(c)),
            },
          };
        }

        return {
          Dir: {
            ...d.Dir,
            content: recursivelyUpdate(d.Dir.content),
          },
        };
      });
    };

    return targetId === dir.id
      ? dir.content.filter((c) => filterEntity(c))
      : recursivelyUpdate(dir.content);
  };
