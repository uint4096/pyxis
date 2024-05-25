import { css } from "@linaria/core";
import { styled } from "@linaria/react";
import { isFile } from "../guards";
import { InputInPlace } from "../../../components/input";
import { GoKebabHorizontal } from "react-icons/go";
import { HiPlus } from "react-icons/hi";
import { MdKeyboardArrowDown, MdKeyboardArrowRight } from "react-icons/md";
import { KeyboardEventHandler, useCallback, useState } from "react";
import { Entity } from "../../../types";

type EntityProps = {
  dirTree: Array<Entity>;
  name: string;
  id: string;
  onDocumentCreation: (id: string, name: string) => Promise<void>;
};

export const Entities = ({
  dirTree,
  name,
  id,
  onDocumentCreation,
}: EntityProps) => {
  const [collapased, setCollapsed] = useState(false);
  const [newDocument, setNewDocument] = useState(false);
  const [documentName, setDocumentName] = useState("");

  const inputKeydown: KeyboardEventHandler<HTMLInputElement> = useCallback(
    async (e) => {
      if (e.key !== "Enter") {
        return;
      }

      await onDocumentCreation(id, documentName);
      setDocumentName("");
      setNewDocument(false);
    },
    [documentName]
  );

  return (
    <DirTreeWrapper>
      <NameContainer>
        <Collapsable onClick={() => setCollapsed((c) => !c)}>
          {collapased ? (
            <MdKeyboardArrowRight className={verticallyMiddle} />
          ) : (
            <MdKeyboardArrowDown className={verticallyMiddle} />
          )}
        </Collapsable>
        <Name>{name}</Name>
        <OptionsContainer>
          <HiPlus
            className={verticallyMiddle}
            onClick={() => setNewDocument(true)}
          />
          <GoKebabHorizontal className={verticallyMiddle} />
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
              <FileName key={entity.File}>{entity.File}</FileName>
            ) : (
              <Entities
                dirTree={entity.Dir.content}
                name={entity.Dir.name}
                id={entity.Dir.id}
                onDocumentCreation={onDocumentCreation}
              ></Entities>
            )
          )}
        </EntityContainer>
      )}
    </DirTreeWrapper>
  );
};

const verticallyMiddle = css`
  vertical-align: middle;
  border-radius: 50%;
  &:hover {
    opacity: 0.7;
  }
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

const OptionsContainer = styled.div`
  display: none;
  height: 100%;
  align-items: center;
  gap: 0.5vw;
`;

const NameContainer = styled.div`
  padding: 0.2vh 0.3vw;
  cursor: pointer;
  display: flex;
  gap: 0.1vw;
  border-radius: 5px;
  opacity: 0.9;

  &:hover {
    background-color: #080808;
  }

  &:hover ${OptionsContainer} {
    display: flex;
  }
`;

const Name = styled.span`
  flex-grow: 1;
`;

const Collapsable = styled.div`
  height: max-content;
`;

const FileName = styled.div`
  padding: 0.2vh 1vw;
  opacity: 0.5;
`;
