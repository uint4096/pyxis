import { styled } from "@linaria/react";
import { useCallback, useEffect, useState } from "react";
import type { Document } from "../../types";
import { InputInPlace } from "../../components";
import { FileContainer } from "./containers/file";
import { DirContainer, TreeDirectory } from "./containers/dir";
import { DirWithChildren, isFile, Node, useTreeStore } from "../../store";
import { File } from "../../ffi";
import { useValidation } from "../../hooks";
import { toast } from "../../utils";

type EntityProps = {
  node: TreeDirectory | Node;
  workspaceUid: string;
  overflowPopup: string | undefined;
  setOverflowPopup: React.Dispatch<React.SetStateAction<string | undefined>>;
  isWorkspace: boolean;
};

export const Entities = ({
  node,
  workspaceUid,
  overflowPopup,
  setOverflowPopup,
  isWorkspace,
}: EntityProps) => {
  const [collapased, setCollapsed] = useState(false);
  const [newDocument, setNewDocument] = useState<Document>();
  const [renameDocument, setRenameDocument] = useState<{
    type: Document;
    uid: string;
  }>();
  const [documentName, setDocumentName] = useState("");

  const { validationFailed, failValidation } = useValidation(documentName);

  const {
    findNode,
    createDir,
    createFile,
    updateDir,
    updateFile,
    selectFile,
    selectedFile,
  } = useTreeStore();

  const createKeydown = useCallback(
    async (
      e: React.KeyboardEvent<HTMLInputElement>,
      parentUid: string | undefined,
    ) => {
      if (e.key === "Escape") {
        setDocumentName("");
        setNewDocument(undefined);
        return;
      }

      if (e.key !== "Enter") {
        return;
      }

      try {
        const parent = parentUid ? findNode(parentUid) : undefined;
        const entityPath = `${parent?.path ?? ""}/${documentName}`;

        if (
          !documentName ||
          ((parent as DirWithChildren)?.children ?? []).find(
            (child) => child.path === entityPath,
          ) ||
          ((node as DirWithChildren)?.children ?? []).find(
            (child) => child.path === entityPath,
          )
        ) {
          failValidation();
          return;
        }

        if (newDocument === "file") {
          const file = await createFile(
            documentName,
            workspaceUid,
            entityPath,
            [],
            [],
            parent?.uid,
          );

          selectFile(undefined);
          selectFile(file);
        } else {
          await createDir(documentName, workspaceUid, entityPath, parent?.uid);
        }

        setDocumentName("");
        setNewDocument(undefined);
      } catch (e) {
        toast("Document creation failed!");
      }
    },
    [
      findNode,
      documentName,
      node,
      newDocument,
      failValidation,
      createFile,
      workspaceUid,
      selectFile,
      createDir,
    ],
  );

  const renameKeydown = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>, uid: string) => {
      if (e.key === "Escape") {
        setDocumentName("");
        setRenameDocument(undefined);
        return;
      }

      if (e.key !== "Enter") {
        return;
      }

      if (!documentName) {
        failValidation();
        return;
      }

      try {
        const node = uid ? findNode(uid) : undefined;
        if (!node) {
          setDocumentName("");
          setRenameDocument(undefined);
          return;
        }

        if (renameDocument?.type === "file") {
          await updateFile({ ...(node as File), title: documentName });
        } else {
          await updateDir({
            ...(node as DirWithChildren),
            name: documentName,
          });
        }

        setDocumentName("");
        setRenameDocument(undefined);
      } catch {
        toast("Failed to rename document!");
      }
    },
    [
      documentName,
      failValidation,
      findNode,
      renameDocument?.type,
      updateDir,
      updateFile,
    ],
  );

  const initDocRename = useCallback(
    (type: Document, uid: string, name: string) => {
      setRenameDocument({ type, uid });
      setDocumentName(name);
    },
    [],
  );

  useEffect(() => {
    setOverflowPopup("");
  }, [newDocument, selectedFile, renameDocument, setOverflowPopup]);

  return (
    <DirTreeWrapper>
      {isFile(node) && node.uid === renameDocument?.uid && (
        <InputInPlace
          size="small"
          value={documentName}
          onKeyDown={(e) => renameKeydown(e, node.uid)}
          onChange={setDocumentName}
          validationFailed={validationFailed}
        />
      )}

      {isFile(node) && node.uid !== renameDocument?.uid && (
        <FileContainer
          file={node}
          overflowPopup={overflowPopup}
          setOverflowPopup={setOverflowPopup}
          initDocRename={initDocRename}
        />
      )}

      {!isFile(node) && (
        <>
          {node.uid === renameDocument?.uid && (
            <InputInPlace
              size="small"
              value={documentName}
              onKeyDown={(e) => renameKeydown(e, node.uid)}
              onChange={setDocumentName}
              validationFailed={validationFailed}
            />
          )}

          {node.uid !== renameDocument?.uid && (
            <DirContainer
              collapsed={collapased}
              setCollapsed={setCollapsed}
              dir={node}
              overflowPopup={overflowPopup}
              setOverflowPopup={setOverflowPopup}
              setNewDocument={setNewDocument}
              isWorkspace={isWorkspace}
              initDocRename={initDocRename}
            />
          )}

          {!collapased && (
            <EntityContainer>
              {newDocument && (
                <InputInPlace
                  size="small"
                  value={documentName}
                  onKeyDown={(e) => createKeydown(e, node.uid)}
                  onChange={setDocumentName}
                  validationFailed={validationFailed}
                />
              )}

              {(node.children ?? []).map((dir) => (
                <Entities
                  node={dir}
                  workspaceUid={workspaceUid}
                  key={dir.id}
                  overflowPopup={overflowPopup}
                  setOverflowPopup={setOverflowPopup}
                  isWorkspace={false}
                />
              ))}
            </EntityContainer>
          )}
        </>
      )}
    </DirTreeWrapper>
  );
};

const DirTreeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  text-align: left;
  margin-top: 0.5vh;
`;

const EntityContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 1vw;
`;
