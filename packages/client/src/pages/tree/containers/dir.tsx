import { css } from "@linaria/core";
import { styled } from "@linaria/react";
import { HiPlus } from "react-icons/hi";
import { MdKeyboardArrowDown, MdKeyboardArrowRight } from "react-icons/md";
import { getOverflowMenu, type MenuOption } from "../../../components";
import { useCallback, useRef } from "react";
import type { Document } from "../../../types";
import {
  flexDisplay,
  NameContainer,
  noDisplay,
  OptionsContainer,
} from "./styles";
import { useTreeStore } from "../../../store/use-tree";
import { noop } from "../../../utils";
import { DirWithChildren, Node } from "../../../store/types";

export type TreeDirectory = {
  children: Array<Node>;
  name: string;
  uid: string;
};

export type DirContainerProps = {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  dir: TreeDirectory | DirWithChildren;
  setOverflowPopup: React.Dispatch<React.SetStateAction<string | undefined>>;
  setNewDocument: React.Dispatch<React.SetStateAction<Document | undefined>>;
  overflowPopup: string | undefined;
};

export const DirContainer = ({
  collapsed,
  setCollapsed,
  dir,
  overflowPopup,
  setOverflowPopup,
  setNewDocument,
}: DirContainerProps) => {
  const optionsRef = useRef<HTMLDivElement>(null);

  const DirOverflow = getOverflowMenu();

  const { deleteDir } = useTreeStore();

  const dirMenuOptions: Array<MenuOption> = [
    {
      handler: async () => setNewDocument("dir"),
      id: "new_directory",
      name: "New Directory",
    },
    {
      handler: async () => {},
      id: "rename",
      name: "Rename",
    },
    {
      handler: useCallback(async () => {
        // if (selectedFile.name && isFileInDir(selectedFile as File, dir)) {
        //   unselect();
        // }

        await deleteDir(dir as DirWithChildren);
      }, [deleteDir, dir]),
      id: "delete",
      name: "Delete",
    },
  ];

  return (
    <>
      {!!dir.uid && (
        <NameContainer>
          <Collapsable onClick={() => setCollapsed((c) => !c)}>
            {collapsed ? (
              <MdKeyboardArrowRight className={verticallyMiddle} />
            ) : (
              <MdKeyboardArrowDown className={verticallyMiddle} />
            )}
          </Collapsable>
          <Name>{dir.name}</Name>
          <OptionsContainer
            className={overflowPopup === dir.uid ? flexDisplay : noDisplay}
          >
            <HiPlus
              className={verticallyMiddle}
              onClick={() => setNewDocument("file")}
            />
            <DirOverflow
              options={dirMenuOptions}
              onClick={() => setOverflowPopup(dir.uid)}
              showMenu={dir.uid === overflowPopup}
              onKeyDown={(e) =>
                e.key === "Escape" ? setOverflowPopup(undefined) : noop()
              }
              ref={optionsRef}
            />
          </OptionsContainer>
        </NameContainer>
      )}
    </>
  );
};

const verticallyMiddle = css`
  vertical-align: middle;
  border-radius: 50%;
  &:hover {
    opacity: 0.7;
  }
`;

const Name = styled.span`
  flex-grow: 1;
`;

const Collapsable = styled.div`
  height: max-content;
`;
