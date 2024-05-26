import { styled } from "@linaria/react";
import { useCallback, useRef, useState } from "react";
import type { WorkspaceConfig } from "../types";
import type { DirEntity, Entity, File } from "../../../types";
import { isFile } from "../guards";
import { createFile } from "../../../ffi";
import { Entities } from "./tree-entities";
import { useOutsideEvent } from "../../../hooks/useOutsideEvent";

type TreeProps = {
  workspace: WorkspaceConfig;
  store: string;
};

export const Tree = ({ workspace, store }: TreeProps) => {
  const [dirTree, setDirTree] = useState(workspace.tree);
  /**
   * Managed outside of CSS because I need to persist the kebab menu
   * regardless of hover once it's clicked
   */
  const [optionsElement, setOptionsElement] = useState<string>("");
  const [showOptions, setOptions] = useState<boolean>(false);

  const updateTree = useCallback(
    (tree: Array<Entity>, id: string, name: string): typeof dirTree => {
      const recursivelyUpdate = (tree: Array<Entity>): Array<Entity> => {
        return tree.map((d) => {
          if (isFile(d)) {
            return d;
          }

          if (d.Dir.id === id) {
            return {
              Dir: {
                ...d.Dir,
                content: [{ File: name }, ...d.Dir.content],
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

      return recursivelyUpdate(tree);
    },
    []
  );

  const pathToDir = useCallback(
    (
      id: string,
      tree = dirTree,
      path = ""
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
          { filePath: "", found: false as boolean }
        ),
    [dirTree]
  );

  const onDocumentCreation = useCallback(
    async (dirId: string, name: string) => {
      const currentTime = new Date().toISOString();
      const file: File = {
        name,
        title: name,
        updated_at: currentTime,
        created_at: currentTime,
        owned_by: "", //@todo: to implement,
        links: [],
        tags: [],
        whitelisted_groups: [],
        whitelisted_users: [],
      };

      const dirPath = pathToDir(dirId)?.filePath;
      const path = `${store}/${workspace.name}${dirPath}`;
      await createFile({ file, path });
      setDirTree((tree) => updateTree(tree, dirId, name));
    },
    []
  );

  const menuRef = useRef<HTMLDivElement>(null);
  useOutsideEvent(menuRef, () => {
    setOptionsElement("");
    setOptions(false);
  });

  return (
    <EntitiesWrapper>
      <Entities
        dirTree={dirTree}
        name={workspace.name}
        id={workspace.id}
        onDocumentCreation={onDocumentCreation}
        dirOptionsState={[optionsElement, setOptionsElement]}
        showOptionsState={[showOptions, setOptions]}
        ref={menuRef}
      />
    </EntitiesWrapper>
  );
};

const EntitiesWrapper = styled.div`
  padding: 3vh 0.5vw;
  height: 70vh;
  background-color: #1a1a1a;
  display: flex;
  flex-direction: column;
  border-radius: 5px;
  width: 13vw;
`;
