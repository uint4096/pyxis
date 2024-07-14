import { styled } from "@linaria/react";
import { useContext, useEffect, useRef, useState } from "react";
import { Entities } from "./tree-entities";
import { useOutsideEvent } from "../../hooks";
import { watchWorkspace } from "../../ffi";
import { ConfigContext } from "../explorer";
import { useWorkspace } from "../../store/useWorkspace";

export const Tree = () => {
  /*
   * Managed outside of CSS because I need to persist the overflow menu
   * regardless of hover once it's clicked
   */
  const [optionsElement, setOptionsElement] = useState<string>("");
  const [showOptions, setOptions] = useState<boolean>(false);
  const { config: wsConfig } = useWorkspace();

  const { workspacePath } = useContext(ConfigContext);

  useEffect(() => {
    (async () => watchWorkspace({ path: workspacePath }))();
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
          dirOptionsState={[optionsElement, setOptionsElement]}
          showOptionsState={[showOptions, setOptions]}
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
