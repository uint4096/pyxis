import { css } from "@linaria/core";
import { styled } from "@linaria/react";
import { isFileEntity } from "./guards";
import { InputInPlace } from "../../components/input";
import { HiPlus } from "react-icons/hi";
import { MdKeyboardArrowDown, MdKeyboardArrowRight } from "react-icons/md";
import {
  KeyboardEventHandler,
  forwardRef,
  useCallback,
  useContext,
  useState,
} from "react";
import type { Document, File, Directory } from "../../types";
import { getOverflowMenu, MenuOption } from "../../components/overflow-menu";
import { nanoid } from "nanoid";
import { pathToDir } from "../../utils";
import { ConfigContext } from "../explorer";
import { useWorkspace } from "../explorer/hooks";

type EntityProps = {
  dir: Directory;
  dirOptionsState: [string, React.Dispatch<React.SetStateAction<string>>];
  showOptionsState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  readFile: (file: File) => Promise<void>;
};

// eslint-disable-next-line react/display-name
export const Entities = forwardRef<HTMLDivElement, EntityProps>(
  (
    {
      dir,
      dirOptionsState: [optionsElement, setOptionsElement],
      showOptionsState: [showOptions, setOptions],
      readFile,
    }: EntityProps,
    ref,
  ) => {
    const { addEntity, removeEntity } = useWorkspace();

    const [collapased, setCollapsed] = useState(false);
    const [newDocument, setNewDocument] = useState<Document>();
    const [documentName, setDocumentName] = useState("");

    const { workspaceConfig } = useContext(ConfigContext);

    const { id, name, content: tree } = dir;

    /*
     * @todo: Both `keydown` actions should be handled natively
     * within the component instead of being drilled down from an
     * outer component.
     * @todo: Can this big JSX below be divided into smaller components?
     * @todo: Is there a better way to show menu and handle actions on the
     * specific element that the user clicks on?
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

    const setElement = useCallback(
      (val: string) => {
        if (!showOptions) {
          setOptionsElement(val);
        }
      },
      [setOptionsElement, showOptions],
    );

    const onMenuKeydown: KeyboardEventHandler<HTMLDivElement> = useCallback(
      (e) => {
        if (e.key === "Escape") {
          setOptionsElement("");
          setOptions(false);
        }
      },
      [setOptions, setOptionsElement],
    );

    const dirMenuOptions: Array<MenuOption> = [
      {
        handler: async () => setNewDocument("dir"),
        id: "new_directory",
        name: "New Directory",
      },
      {
        handler: async () => {},
        id: "rename",
        name: "Rename",
      },
      {
        handler: useCallback(
          async (dir: Directory) => removeEntity(dir),
          [removeEntity],
        ),
        id: "delete",
        name: "Delete",
      },
    ];

    const fileMenuOptions: Array<MenuOption> = [
      {
        handler: async () => {},
        id: "rename",
        name: "Rename",
      },
      {
        handler: useCallback(
          async (file: File) => removeEntity(file),
          [removeEntity],
        ),
        id: "delete",
        name: "Delete",
      },
    ];

    const FileOverflow = getOverflowMenu<File>();
    const DirOverflow = getOverflowMenu<Directory>();

    return (
      <DirTreeWrapper>
        <NameContainer
          onMouseEnter={() => setElement(id)}
          onMouseLeave={() => setElement("")}
          className={optionsElement === id ? backgroundHighlight : ""}
        >
          <Collapsable onClick={() => setCollapsed((c) => !c)}>
            {collapased ? (
              <MdKeyboardArrowRight className={verticallyMiddle} />
            ) : (
              <MdKeyboardArrowDown className={verticallyMiddle} />
            )}
          </Collapsable>
          <Name>{name}</Name>
          <OptionsContainer className={id === optionsElement ? show : hide}>
            <HiPlus
              className={verticallyMiddle}
              onClick={() => setNewDocument("file")}
            />
            <DirOverflow
              options={dirMenuOptions}
              onClick={() => setOptions((opt) => !opt)}
              showMenu={!!showOptions && id === optionsElement}
              onKeyDown={onMenuKeydown}
              ref={ref}
              rootElement={dir}
            />
          </OptionsContainer>
        </NameContainer>

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
                !entity.File.hidden && (
                  <NameContainer
                    onMouseEnter={() => setElement(`${id}/${entity.File.name}`)}
                    onMouseLeave={() => setElement("")}
                    onClick={() => readFile(entity.File)}
                    className={
                      optionsElement === `${id}/${entity.File.name}`
                        ? backgroundHighlight
                        : ""
                    }
                  >
                    <FileName key={`${id}/${entity.File.name}}`}>
                      {entity.File.name}
                    </FileName>
                    <OptionsContainer
                      className={
                        optionsElement === `${id}/${entity.File.name}`
                          ? show
                          : hide
                      }
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FileOverflow
                        options={fileMenuOptions}
                        onClick={() => setOptions((opt) => !opt)}
                        showMenu={
                          !!showOptions &&
                          optionsElement === `${id}/${entity.File.name}`
                        }
                        onKeyDown={onMenuKeydown}
                        ref={ref}
                        rootElement={entity.File}
                      />
                    </OptionsContainer>
                  </NameContainer>
                )
              ) : (
                <Entities
                  dir={entity.Dir}
                  dirOptionsState={[optionsElement, setOptionsElement]}
                  showOptionsState={[showOptions, setOptions]}
                  key={entity.Dir.id}
                  readFile={readFile}
                />
              ),
            )}
          </EntityContainer>
        )}
      </DirTreeWrapper>
    );
  },
);

const verticallyMiddle = css`
  vertical-align: middle;
  border-radius: 50%;
  &:hover {
    opacity: 0.7;
  }
`;

const backgroundHighlight = css`
  background-color: #080808;
`;

const hide = css`
  display: none;
`;

const show = css`
  display: flex;
`;

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

const FileName = styled.div`
  padding: 0.2vh 0vw;
  margin-left: 1vw;
  opacity: 0.5;
  &:hover {
    background-color: #080808;
  }
`;

const OptionsContainer = styled.div`
  height: 100%;
  align-items: center;
  gap: 0.5vw;
`;

const NameContainer = styled.div`
  padding: 0.2vh 0.3vw;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  gap: 0.1vw;
  border-radius: 5px;
  opacity: 0.9;

  &:hover {
    background-color: #080808;
  }

  &:hover ${FileName} {
    opacity: 0.9;
  }
`;

const Name = styled.span`
  flex-grow: 1;
`;

const Collapsable = styled.div`
  height: max-content;
`;
