import { styled } from "@linaria/react";
import { useCallback, useRef, useState } from "react";
import type { WorkspaceConfig } from "../types";
import type {
  DirEntity,
  Directory,
  Document,
  Entity,
  File,
  FileEntity,
} from "../../../types";
import { isFile } from "../guards";
import { createFile, createDir, deleteFile, deleteDir } from "../../../ffi";
import { Entities } from "./tree-entities";
import { useOutsideEvent } from "../../../hooks/useOutsideEvent";
import { nanoid } from "nanoid";

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

  console.log("WORKSPACE: ", workspace);

  const updateTree = useCallback(
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
      },
    []
  );

  const deleteFromTree = useCallback(
    (dir: Directory, targetId: string) =>
      (type: Document, entity: File | Directory): Array<Entity> => {
        const filterEntity = (e: Entity) => {
          if (type === 'file' && isFile(e) && e.File.name === entity.name) {
            return false;
          }
          
          if (type === 'dir' && !isFile(e) && e.Dir.id === (entity as Directory).id) {
            return false
          }

          return true;
        }

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
    (type: Document) => async (dirId: string, name: string) => {
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
          hidden: false,
        };

        if (!(await createFile({ file, path }))) {
          //@todo: Handle error and show toast message
          return;
        }

        const newTree = computeTree("file", file);
        refreshTree(newTree);
      } else {
        const dir = {
          name,
          id: nanoid(),
          content: [],
        };

        if (!(await createDir({ dir, path }))) {
          //@todo: Handle error and show toast message
          return;
        }

        const newTree = computeTree("dir", dir);
        refreshTree(newTree);
      }
    },
    [pathToDir, refreshTree, store, updateTree, workspace]
  );

  const onDocumentDelete = (type: Document) => async (dirId: string, entity: File | Directory) => {
    const dirPath = pathToDir(dirId)?.filePath;
    const path = `${store}/${workspace.name}${dirPath}`;

    const { id, name: workspaceName, tree } = workspace;

    const computeTree = deleteFromTree(
      { id, name: workspaceName, content: tree },
      dirId
    );

    const response = type === 'file' ? await deleteFile({ file: entity as File, path }) : await deleteDir({ dir: entity as Directory, path })

    if (!response) {
      //@todo: Handle error and show toast message
      return;
    }

    const treee = computeTree(type, entity);
    refreshTree(treee); 
  };

  const menuRef = useRef<HTMLDivElement>(null);
  useOutsideEvent(menuRef, () => {
    setOptionsElement("");
    setOptions(false);
  });

  const actions = {
    onFileCreation: onDocumentCreation("file"),
    onDirCreation: onDocumentCreation("dir"),
    onDeleteFile: onDocumentDelete('file'),
    onDeleteDir: onDocumentDelete('dir')
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
