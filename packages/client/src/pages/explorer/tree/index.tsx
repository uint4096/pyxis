import { styled } from "@linaria/react";
import { useCallback, useRef, useState } from "react";
import type { WorkspaceConfig } from "../types";
import type {
  DirEntity,
  Directory,
  Entity,
  File,
  FileEntity,
} from "../../../types";
import { isFile } from "../guards";
import { createFile, createDir } from "../../../ffi";
import { Entities } from "./tree-entities";
import { useOutsideEvent } from "../../../hooks/useOutsideEvent";

type TreeProps = {
  workspace: WorkspaceConfig;
  store: string;
  refreshTree: (tree: Array<Entity>) => void;
};

export const Tree = ({ workspace, store, refreshTree }: TreeProps) => {
  /**
   * Managed outside of CSS because I need to persist the overflow menu
   * regardless of hover once it's clicked
   */
  const [optionsElement, setOptionsElement] = useState<string>("");
  const [showOptions, setOptions] = useState<boolean>(false);

  const updateTree = useCallback(
    (dir: Directory, targetId: string) =>
      (type: "file" | "dir", entity: File | Directory): Array<Entity> => {
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
      },
    []
  );

  const pathToDir = useCallback(
    (
      id: string,
      tree = workspace.tree,
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
    [workspace.tree]
  );

  const onDocumentCreation = useCallback(
    (type: "file" | "dir") => async (dirId: string, name: string) => {
      const currentTime = new Date().toISOString();
      const dirPath = pathToDir(dirId)?.filePath;
      const path = `${store}/${workspace.name}${dirPath}`;

      const { id, name: workspaceName, tree } = workspace;

      const computeTree = updateTree(
        { id, name: workspaceName, content: tree },
        dirId
      );

      if (type === "file") {
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

        await createFile({ file, path });
        const tree = computeTree("file", file);
        refreshTree(tree);
      } else {
        const dir = {
          name,
          id: dirId,
          content: [],
        };

        await createDir({ dir, path });
        const tree = computeTree("dir", dir);
        refreshTree(tree);
      }
    },
    [workspace]
  );

  const menuRef = useRef<HTMLDivElement>(null);
  useOutsideEvent(menuRef, () => {
    setOptionsElement("");
    setOptions(false);
  });

  const actions = {
    onFileCreation: onDocumentCreation("file"),
    onDirCreation: onDocumentCreation("dir"),
  };

  return (
    <EntitiesWrapper>
      <Entities
        dirTree={workspace.tree}
        name={workspace.name}
        id={workspace.id}
        actions={actions}
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
  overflow: auto;
`;
