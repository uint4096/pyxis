import { styled } from "@linaria/react";
import { Entities } from "./tree-entities";
import { useCallback, useEffect, useState } from "react";
import { useWorkspace, useTreeStore } from "../../store";

export const Tree = () => {
  const { tree, createTree } = useTreeStore();
  const { currentWorkspace } = useWorkspace();

  const [overflowPopup, setOverflowPopup] = useState<string | undefined>();

  useEffect(() => {
    if (!tree.length && currentWorkspace?.uid) {
      createTree(currentWorkspace.uid);
    }
  }, [createTree, currentWorkspace.uid, tree.length]);

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
