import type {
  Directory,
  File,
  Entity,
  Document,
  FileEntity,
  DirEntity,
} from "../../../../../types";
import { isFile } from "../../../tree/guards";

export const updateTree =
  (dir: Directory, targetId: string) =>
  (type: Document, entity: File | Directory): Array<Entity> => {
    const addition =
      type === "file"
        ? ({ File: entity } as FileEntity)
        : ({ Dir: entity } as DirEntity);

    const recursivelyUpdate = (tree: Array<Entity>): Array<Entity> => {
      return tree.map((d) => {
        if (isFile(d)) {
          return d;
        }

        if (d.Dir.id === targetId) {
          return {
            Dir: {
              ...d.Dir,
              content: [addition, ...d.Dir.content],
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
      ? [...dir.content, addition]
      : recursivelyUpdate(dir.content);
  };
