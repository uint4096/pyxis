import { styled } from "@linaria/react";
import { useContext, useEffect, useRef, useState } from "react";
import type { Entity, File } from "../../types";
import { Entities } from "./tree-entities";
import { useOutsideEvent } from "../../hooks";
import { useWorkspace } from "../explorer/hooks";
import { watchWorkspace } from "../../ffi";
import { ConfigContext } from "../explorer";

type TreeProps = {
  readFile: (file: File) => Promise<void>;
};

export const Tree = ({ readFile }: TreeProps) => {
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

  const menuRef = useRef<HTMLDivElement>(null);
  useOutsideEvent(menuRef, () => {
    setOptionsElement("");
    setOptions(false);
  });

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
          ref={menuRef}
          readFile={readFile}
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
