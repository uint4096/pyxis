import { styled } from "@linaria/react";
import { useRef, useState } from "react";
import type { WorkspaceConfig } from "../types";
import type { Entity } from "../../../types";
import { Entities } from "./tree-entities";
import { useOutsideEvent } from "../../../hooks/useOutsideEvent";
import { useWorkspace } from "./hooks/useWorkspace";

type TreeProps = {
  workspace: WorkspaceConfig;
  store: string;
  refreshTree: (tree: Array<Entity>) => void;
  workspacePath: string;
};

export const Tree = ({
  workspace,
  store,
  refreshTree,
  workspacePath,
}: TreeProps) => {
  /*
   * Managed outside of CSS because I need to persist the overflow menu
   * regardless of hover once it's clicked
   */
  const [optionsElement, setOptionsElement] = useState<string>("");
  const [showOptions, setOptions] = useState<boolean>(false);
  const { config: wsConfig, handlers } = useWorkspace({
    refreshTree,
    store,
    workspaceConfig: workspace,
    workspacePath,
  });

  const menuRef = useRef<HTMLDivElement>(null);
  useOutsideEvent(menuRef, () => {
    setOptionsElement("");
    setOptions(false);
  });

  return (
    <EntitiesWrapper>
      {wsConfig && (
        <Entities
          dirTree={wsConfig.tree}
          name={wsConfig.name}
          id={wsConfig.id}
          actions={handlers}
          dirOptionsState={[optionsElement, setOptionsElement]}
          showOptionsState={[showOptions, setOptions]}
          ref={menuRef}
        />
      )}
    </EntitiesWrapper>
  );
};

const EntitiesWrapper = styled.div`
  padding: 3vh 0.5vw;
  height: 70vh;
  background-color: #1a1a1a;
  display: flex;
  flex-direction: column;
  border-radius: 5px;
  width: 13vw;
  overflow: auto;
`;
