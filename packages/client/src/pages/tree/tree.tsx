import { styled } from "@linaria/react";
import { Entities } from "./tree-entities";
import { useWorkspace } from "../../store/useWorkspace";

export const Tree = () => {
  const { config: wsConfig } = useWorkspace();

  return (
    <EntitiesWrapper>
      {wsConfig.tree && wsConfig.id && wsConfig.name && (
        <Entities
          dir={{
            content: wsConfig.tree,
            id: wsConfig.id,
            name: wsConfig.name,
            path: "",
          }}
        />
      )}
    </EntitiesWrapper>
  );
};

const EntitiesWrapper = styled.div`
  padding: 3vh 0.5vw;
  height: 100%;
  background-color: #1a1a1a;
  display: flex;
  flex-direction: column;
  border-radius: 5px;
  width: 15vw;
  overflow: auto;
`;
