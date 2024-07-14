import { styled } from "@linaria/react";
import { KeyboardEventHandler, useCallback, useState } from "react";
import type { Document, File, Directory } from "../../types";
import { InputInPlace } from "../../components";
import { nanoid } from "nanoid";
import { pathToDir, isFileEntity } from "../../utils";
import { useWorkspace } from "../../store";
import { FileContainer } from "./containers/file";
import { DirContainer } from "./containers/dir";

type EntityProps = {
  dir: Directory;
  dirOptionsState: [string, React.Dispatch<React.SetStateAction<string>>];
  showOptionsState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
};

export const Entities = ({
  dir,
  dirOptionsState: [optionsElement, setOptionsElement],
  showOptionsState: [showOptions, setOptions],
}: EntityProps) => {
  const {
    config: workspaceConfig,
    path: workspacePath,
    addEntity,
  } = useWorkspace();

  const [collapased, setCollapsed] = useState(false);
  const [newDocument, setNewDocument] = useState<Document>();
  const [documentName, setDocumentName] = useState("");

  const [overflowPopup, setOverflowPopup] = useState("");

  const { id, content: tree } = dir;

  /*
   * @todo: Both `keydown` actions should be handled natively
   * within the component instead of being drilled down from an
   * outer component.
   */

  const inputKeydown: KeyboardEventHandler<HTMLInputElement> = useCallback(
    async (e) => {
      if (e.key === "Escape") {
        setDocumentName("");
        setNewDocument(undefined);
        return;
      }

      if (e.key !== "Enter") {
        return;
      }

      const currentTime = new Date().toISOString();
      const { path: entityPath } = pathToDir(id, workspaceConfig?.tree);
      const path = `${entityPath}/${documentName}`;

      const entity =
        newDocument === "file"
          ? {
              name: documentName,
              title: documentName,
              updated_at: currentTime,
              created_at: currentTime,
              owned_by: "", //@todo: to implement,
              links: [],
              tags: [],
              whitelisted_groups: [],
              whitelisted_users: [],
              hidden: false,
              path,
            }
          : {
              name: documentName,
              id: nanoid(10),
              content: [],
              path,
            };

      await (newDocument === "file"
        ? addEntity(entity as File)
        : addEntity(entity as Directory));

      setDocumentName("");
      setNewDocument(undefined);
    },
    [id, workspaceConfig?.tree, documentName, newDocument, addEntity],
  );

  return (
    <DirTreeWrapper>
      <DirContainer
        collapsed={collapased}
        setCollapsed={setCollapsed}
        dir={dir}
        overflowPopup={overflowPopup}
        setOverflowPopup={setOverflowPopup}
      />

      {!collapased && (
        <EntityContainer>
          {newDocument && (
            <InputInPlace
              size="small"
              value={documentName}
              onKeyDown={inputKeydown}
              onChange={setDocumentName}
            />
          )}

          {tree.map((entity) =>
            isFileEntity(entity) ? (
              !entity.File.hidden &&
              workspacePath && (
                <FileContainer
                  file={entity.File}
                  dirId={dir.id}
                  overflowPopup={overflowPopup}
                  setOverflowPopup={setOverflowPopup}
                />
              )
            ) : (
              <Entities
                dir={entity.Dir}
                dirOptionsState={[optionsElement, setOptionsElement]}
                showOptionsState={[showOptions, setOptions]}
                key={entity.Dir.id}
              />
            ),
          )}
        </EntityContainer>
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
