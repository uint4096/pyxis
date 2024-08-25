import { styled } from "@linaria/react";
import { Entities } from "./tree-entities";
import { useWorkspace } from "../../store/use-workspace";
import { useEffect } from "react";
import { useTreeStore } from "../../store/use-tree";

export const Tree = () => {
  const { tree, createTree } = useTreeStore();
  const { currentWorkspace } = useWorkspace();

  useEffect(() => {
    if (!tree.length && currentWorkspace?.uid) {
      createTree(currentWorkspace.uid);
    }
  }, [createTree, currentWorkspace.uid, tree.length]);

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
