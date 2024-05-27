import { css } from "@linaria/core";
import { styled } from "@linaria/react";
import { isFile } from "../guards";
import { InputInPlace } from "../../../components/input";
import { HiPlus } from "react-icons/hi";
import { MdKeyboardArrowDown, MdKeyboardArrowRight } from "react-icons/md";
import { KeyboardEventHandler, forwardRef, useCallback, useState } from "react";
import { Entity } from "../../../types";
import { OverflowMenu, MenuOption } from "../../../components/overflow-menu";

type Actions = {
  onFileCreation: (id: string, name: string) => Promise<void>;
  onDirCreation: (id: string, name: string) => Promise<void>;
};

type Document = "file" | "dir";

type EntityProps = {
  dirTree: Array<Entity>;
  name: string;
  id: string;
  actions: Actions;
  dirOptionsState: [string, React.Dispatch<React.SetStateAction<string>>];
  showOptionsState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
};

export const Entities = forwardRef<HTMLDivElement, EntityProps>(
  (
    {
      dirTree,
      name,
      id,
      actions,
      dirOptionsState: [optionsElement, setOptionsElement],
      showOptionsState: [showOptions, setOptions],
    }: EntityProps,
    ref
  ) => {
    const [collapased, setCollapsed] = useState(false);
    const [newDocument, setNewDocument] = useState<Document>();
    const [documentName, setDocumentName] = useState("");

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

        await (newDocument === "file"
          ? actions.onFileCreation(id, documentName)
          : actions.onDirCreation(id, documentName));
        setDocumentName("");
        setNewDocument(undefined);
      },
      [documentName]
    );

    const setElement = useCallback(
      (val: string) => {
        if (!showOptions) {
          setOptionsElement(val);
        }
      },
      [showOptions]
    );

    const onMenuKeydown: KeyboardEventHandler<HTMLDivElement> = useCallback(
      (e) => {
        if (e.key === "Escape") {
          setOptionsElement("");
          setOptions(false);
        }
      },
      []
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
        handler: async () => {},
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
        handler: async () => {},
        id: "delete",
        name: "Delete",
      },
    ];

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
            <OverflowMenu
              options={dirMenuOptions}
              onClick={() => setOptions((opt) => !opt)}
              showMenu={!!showOptions && id === optionsElement}
              onKeyDown={onMenuKeydown}
              ref={ref}
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
            {dirTree.map((entity) =>
              isFile(entity) ? (
                !entity.File.hidden && (
                  <NameContainer
                    onMouseEnter={() => setElement(`${id}/${entity.File.name}`)}
                    onMouseLeave={() => setElement("")}
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
                    >
                      <OverflowMenu
                        options={fileMenuOptions}
                        onClick={() => setOptions((opt) => !opt)}
                        showMenu={
                          !!showOptions &&
                          optionsElement === `${id}/${entity.File.name}`
                        }
                        onKeyDown={onMenuKeydown}
                        ref={ref}
                      />
                    </OptionsContainer>
                  </NameContainer>
                )
              ) : (
                <Entities
                  dirTree={entity.Dir.content}
                  name={entity.Dir.name}
                  id={entity.Dir.id}
                  actions={actions}
                  dirOptionsState={[optionsElement, setOptionsElement]}
                  showOptionsState={[showOptions, setOptions]}
                />
              )
            )}
          </EntityContainer>
        )}
      </DirTreeWrapper>
    );
  }
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
`;

const EntityContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 1vw;
`;

const FileName = styled.div`
  padding: 0.2vh 1vw;
  opacity: 0.5;
  &:hover {
    background-color: #080808;
    opacity: 0.9;
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
`;

const Name = styled.span`
  flex-grow: 1;
`;

const Collapsable = styled.div`
  height: max-content;
`;
