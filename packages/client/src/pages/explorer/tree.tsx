import { styled } from "@linaria/react";
import type { Entity } from "./types";
import { isFile } from "./guards";

type TreeProps = {
  dirTree: Array<Entity>;
  name: string;
};

const Entities = ({ dirTree, name }: TreeProps) => {
  return (
    <DirTreeWrapper>
      <Name>{name}</Name>
      <EntityContainer>
        {dirTree.map((entity) =>
          isFile(entity) ? (
            <File key={entity.File}>{entity.File}</File>
          ) : (
            <Entities dirTree={entity.Dir[1]} name={entity.Dir[0]}></Entities>
          )
        )}
      </EntityContainer>
    </DirTreeWrapper>
  );
};

export const Tree = ({ dirTree, name }: TreeProps) => <EntitiesWrapper><Entities dirTree={dirTree} name={name}/></EntitiesWrapper>

const EntitiesWrapper = styled.div`
  padding: 3vh 0.5vw;
  height: 70vh;
  background-color: #1a1a1a;
  display: flex;
  flex-direction: column;
  border-radius: 5px;
`
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

const Name = styled.span`
  padding: 0.2vh 1vw;
`;
  
const File = styled.div`
  padding: 0.2vh 1vw;
  opacity: 0.5;
`;

