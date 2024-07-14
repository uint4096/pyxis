import { styled } from "@linaria/react";
import { Entities } from "./tree-entities";
import { watchWorkspace } from "../../ffi";
import { useWorkspace } from "../../store/useWorkspace";
import { useEffect } from "react";

export const Tree = () => {
  const { config: wsConfig, path: workspacePath } = useWorkspace();

  useEffect(() => {
    if (!workspacePath) {
      return;
    }

    (async () => await watchWorkspace({ path: workspacePath }))();
  }, [workspacePath]);

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
