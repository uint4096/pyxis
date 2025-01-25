import { styled } from "@linaria/react";
import { useCallback, useEffect, useState } from "react";
import type { Document } from "../../types";
import { InputInPlace } from "../../components";
import { FileContainer } from "./containers/file";
import { DirContainer, TreeDirectory } from "./containers/dir";
import { isFile, Node, useTreeStore } from "../../store";

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
  const [documentName, setDocumentName] = useState("");

  const { findNode, createDir, createFile, selectedFile } = useTreeStore();

  const inputKeydown = useCallback(
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

      const parent = parentUid ? findNode(parentUid) : undefined;
      const entityPath = `${parent?.path ?? ""}/${documentName}`;

      if (newDocument === "file") {
        await createFile(
          documentName,
          workspaceUid,
          entityPath,
          [],
          [],
          parent?.uid,
        );
      } else {
        await createDir(documentName, workspaceUid, entityPath, parent?.uid);
      }

      setDocumentName("");
      setNewDocument(undefined);
    },
    [findNode, documentName, newDocument, createFile, workspaceUid, createDir],
  );

  useEffect(() => {
    setOverflowPopup("");
  }, [newDocument, selectedFile, setOverflowPopup]);

  return (
    <DirTreeWrapper>
      {isFile(node) ? (
        <FileContainer
          file={node}
          overflowPopup={overflowPopup}
          setOverflowPopup={setOverflowPopup}
        />
      ) : (
        <>
          <DirContainer
            collapsed={collapased}
            setCollapsed={setCollapsed}
            dir={node}
            overflowPopup={overflowPopup}
            setOverflowPopup={setOverflowPopup}
            setNewDocument={setNewDocument}
            isWorkspace={isWorkspace}
          />

          {!collapased && (
            <EntityContainer>
              {newDocument && (
                <InputInPlace
                  size="small"
                  value={documentName}
                  onKeyDown={(e) => inputKeydown(e, node.uid)}
                  onChange={setDocumentName}
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
