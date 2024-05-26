import { css } from "@linaria/core";
import { styled } from "@linaria/react";
import { isFile } from "../guards";
import { InputInPlace } from "../../../components/input";
import { HiPlus } from "react-icons/hi";
import { MdKeyboardArrowDown, MdKeyboardArrowRight } from "react-icons/md";
import { KeyboardEventHandler, forwardRef, useCallback, useState } from "react";
import { Entity } from "../../../types";
import { KebabMenu, MenuOption } from "../../../components/kebab-menu";

type EntityProps = {
  dirTree: Array<Entity>;
  name: string;
  id: string;
  onDocumentCreation: (id: string, name: string) => Promise<void>;
  dirOptionsState: [string, React.Dispatch<React.SetStateAction<string>>];
  showOptionsState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
};

export const Entities = forwardRef<HTMLDivElement, EntityProps>(
  (
    {
      dirTree,
      name,
      id,
      onDocumentCreation,
      dirOptionsState: [optionsElement, setOptionsElement],
      showOptionsState: [showOptions, setOptions],
    }: EntityProps,
    ref
  ) => {
    const [collapased, setCollapsed] = useState(false);
    const [newDocument, setNewDocument] = useState(false);
    const [documentName, setDocumentName] = useState("");

    const inputKeydown: KeyboardEventHandler<HTMLInputElement> = useCallback(
      async (e) => {
        if (e.key === "Escape") {
          setDocumentName("");
          setNewDocument(false);
          return;
        }

        if (e.key !== "Enter") {
          return;
        }

        await onDocumentCreation(id, documentName);
        setDocumentName("");
        setNewDocument(false);
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
        handler: async () => {},
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
              onClick={() => setNewDocument(true)}
            />
            <KebabMenu
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
                <NameContainer
                  onMouseEnter={() => setElement(`${id}/${entity.File}`)}
                  onMouseLeave={() => setElement("")}
                  className={
                    optionsElement === `${id}/${entity.File}`
                      ? backgroundHighlight
                      : ""
                  }
                >
                  <FileName key={entity.File}>{entity.File}</FileName>
                  <OptionsContainer
                    className={
                      optionsElement === `${id}/${entity.File}` ? show : hide
                    }
                  >
                    <KebabMenu
                      options={fileMenuOptions}
                      onClick={() => setOptions((opt) => !opt)}
                      showMenu={
                        !!showOptions &&
                        optionsElement === `${id}/${entity.File}`
                      }
                      onKeyDown={onMenuKeydown}
                      ref={ref}
                    />
                  </OptionsContainer>
                </NameContainer>
              ) : (
                <Entities
                  dirTree={entity.Dir.content}
                  name={entity.Dir.name}
                  id={entity.Dir.id}
                  onDocumentCreation={onDocumentCreation}
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
