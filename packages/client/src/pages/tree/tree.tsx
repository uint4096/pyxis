import { styled } from "@linaria/react";
import { Entities } from "./tree-entities";
import { useCallback, useEffect, useState } from "react";
import { useWorkspace, useTreeStore } from "../../store";
import { BsBoxArrowLeft } from "react-icons/bs";

type TreeProps = {
  setExplorerVisibility: React.Dispatch<React.SetStateAction<boolean>>;
  explorerVisibility: boolean;
};

export const Tree = ({
  setExplorerVisibility,
  explorerVisibility,
}: TreeProps) => {
  const { tree, createTree } = useTreeStore();
  const { currentWorkspace } = useWorkspace();

  const [overflowPopup, setOverflowPopup] = useState<string | undefined>();

  useEffect(() => {
    if (currentWorkspace?.uid) {
      (async () => await createTree(currentWorkspace.uid!))();
    }
  }, [createTree, currentWorkspace.uid]);

  const keyListener = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && overflowPopup) {
        setOverflowPopup("");
      }
    },
    [overflowPopup],
  );

  useEffect(() => {
    document.addEventListener("keydown", keyListener);

    return () => document.removeEventListener("keydown", keyListener);
  }, [keyListener, overflowPopup]);

  return (
    <TreeContainer hidden={!explorerVisibility}>
      <EntitiesWrapper>
        {!!currentWorkspace?.uid && tree && (
          <Entities
            node={{
              children: tree,
              uid: currentWorkspace.uid,
              name: currentWorkspace.name ?? "",
            }}
            workspaceUid={currentWorkspace.uid}
            overflowPopup={overflowPopup}
            setOverflowPopup={setOverflowPopup}
            isWorkspace={true}
          />
        )}
      </EntitiesWrapper>
      <IconWrapper>
        <BsBoxArrowLeft
          size={22}
          onClick={() => setExplorerVisibility(false)}
          opacity={0.7}
        />
      </IconWrapper>
    </TreeContainer>
  );
};

const EntitiesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  overflow: auto;
`;

const IconWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  cursor: pointer;
  & > *:hover {
    filter: drop-shadow(0 0 3px #ff7f50);
  }
`;

const TreeContainer = styled.div`
  width: 15vw;
  padding: 2vh 0.5vw;
  height: 100%;
  background-color: #040404;
  visibility: ${(props) => (props.hidden ? "hidden" : "visible")};
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  z-index: 999;
  border-right: 0.5px dotted gray;
  position: relative;
`;
