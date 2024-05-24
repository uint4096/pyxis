import { styled } from "@linaria/react";
import { css } from "@linaria/core";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";

import type { Entity, WorkspaceConfig } from "./types";
import { isFile } from "./guards";
import { useState } from "react";

type TreeProps = {
  workspace: WorkspaceConfig;
};

type EntityProps = {
  dirTree: Array<Entity>;
  name: string;
}

const Entities = ({ dirTree, name }: EntityProps) => {
  const [collapased, setCollapsed] = useState(false);

  return (
    <DirTreeWrapper>
      <Name>
        <Collapsable onClick={() => setCollapsed((c) => !c)}>{ collapased ? <MdKeyboardArrowUp className={verticallyMiddle}/> : <MdKeyboardArrowDown className={verticallyMiddle}/>}</Collapsable>
        <div>{name}</div>
      </Name>
      {!collapased && <EntityContainer>
        {dirTree.map((entity) =>
          isFile(entity) ? (
            <File key={entity.File}>{entity.File}</File>
          ) : (
            <Entities dirTree={entity.Dir[1]} name={entity.Dir[0]}></Entities>
          )
        )}
      </EntityContainer>}
    </DirTreeWrapper>
  );
};

export const Tree = ({ workspace }: TreeProps) => <EntitiesWrapper><Entities dirTree={workspace.tree} name={workspace.name}/></EntitiesWrapper>

const verticallyMiddle = css`
  vertical-align: middle;
`;

const EntitiesWrapper = styled.div`
  padding: 3vh 0.5vw;
  height: 70vh;
  background-color: #1a1a1a;
  display: flex;
  flex-direction: column;
  border-radius: 5px;
  width: 13vw;
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

const Name = styled.div`
  padding: 0.2vh 0.3vw;
  cursor: pointer;
  display: flex;
  gap: 0.1vw;
  border-radius: 5px;
  opacity: 0.9;

  &:hover {
    background-color: black;
  }
`;

const Collapsable = styled.div`
  height: max-content;
  vertical-align: bottom;
`;

const File = styled.div`
  padding: 0.2vh 1vw;
  opacity: 0.5;
`;

