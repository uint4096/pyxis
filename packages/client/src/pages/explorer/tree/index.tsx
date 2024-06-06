import { styled } from "@linaria/react";
import { useRef, useState } from "react";
import type { WorkspaceConfig } from "../types";
import type { Entity, File } from "../../../types";
import { Entities } from "./tree-entities";
import { useOutsideEvent } from "../../../hooks";
import { useWorkspace } from "../hooks";

type TreeProps = {
  workspace: WorkspaceConfig;
  refreshTree: (tree: Array<Entity>) => void;
  workspacePath: string;
  readFile: (targetId: string, file: File) => Promise<void>;
};

export const Tree = ({
  workspace,
  refreshTree,
  workspacePath,
  readFile,
}: TreeProps) => {
  /*
   * Managed outside of CSS because I need to persist the overflow menu
   * regardless of hover once it's clicked
   */
  const [optionsElement, setOptionsElement] = useState<string>("");
  const [showOptions, setOptions] = useState<boolean>(false);
  const { config: wsConfig, handlers } = useWorkspace({
    refreshTree,
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
          dir={{
            content: wsConfig.tree,
            id: wsConfig.id,
            name: wsConfig.name,
            path: "",
          }}
          workspaceActions={handlers}
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
  height: 70vh;
  background-color: #1a1a1a;
  display: flex;
  flex-direction: column;
  border-radius: 5px;
  width: 13vw;
  overflow: auto;
`;
