import { css } from "@linaria/core";
import { styled } from "@linaria/react";
import { HiPlus } from "react-icons/hi";
import { MdKeyboardArrowDown, MdKeyboardArrowRight } from "react-icons/md";
import { useCallback, useRef } from "react";
import { CiFolderOn } from "react-icons/ci";

import { getOverflowMenu, type MenuOption } from "../../../components";
import type { Document } from "../../../types";
import {
  backgroundHover,
  flexDisplay,
  NameContainer,
  noDisplay,
  OptionsContainer,
} from "./styles";
import { noop, toast } from "../../../utils";
import { useTreeStore, type DirWithChildren, type Node } from "../../../store";
import { useOutsideEvent } from "../../../hooks";

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
  isWorkspace: boolean;
  initDocRename: (type: Document, uid: string, name: string) => void;
};

export const DirContainer = ({
  collapsed,
  setCollapsed,
  dir,
  overflowPopup,
  setOverflowPopup,
  setNewDocument,
  isWorkspace,
  initDocRename,
}: DirContainerProps) => {
  const optionsRef = useRef<HTMLDivElement>(null);

  const DirOverflow = getOverflowMenu();

  useOutsideEvent(optionsRef, () => {
    setOverflowPopup("");
  });

  const { deleteDir, selectedFile, selectFile, isFileInDir } = useTreeStore();

  const dirMenuOptions: Array<MenuOption> = [
    {
      handler: async () => setNewDocument("dir"),
      id: "new_directory",
      name: "New Directory",
    },
  ];

  if (!isWorkspace) {
    dirMenuOptions.push(
      ...[
        {
          handler: () => initDocRename("dir", dir.uid, dir.name),
          id: "rename",
          name: "Rename",
        },
        {
          handler: useCallback(async () => {
            if (
              selectedFile?.path &&
              isFileInDir(selectedFile.uid, dir as DirWithChildren)
            ) {
              selectFile(undefined);
            }

            try {
              await deleteDir(dir as DirWithChildren);
            } catch {
              toast("Failed to delete directory!");
            }
          }, [
            deleteDir,
            dir,
            isFileInDir,
            selectFile,
            selectedFile?.path,
            selectedFile?.uid,
          ]),
          id: "delete",
          name: "Delete",
        },
      ],
    );
  }

  return (
    <>
      {!!dir.uid && (
        <NameContainer
          className={overflowPopup === dir.uid ? backgroundHover : ""}
        >
          <Flexbox>
            <Collapsable onClick={() => setCollapsed((c) => !c)}>
              {collapsed ? (
                <MdKeyboardArrowRight className={verticallyMiddle} />
              ) : (
                <MdKeyboardArrowDown className={verticallyMiddle} />
              )}
            </Collapsable>
            {!isWorkspace && (
              <NameWithIcon>
                <CiFolderOn size={15} className={verticallyMiddle} />
                <Name>{dir.name}</Name>
              </NameWithIcon>
            )}
            {isWorkspace && <Name>{dir.name}</Name>}
          </Flexbox>

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

const Flexbox = styled.div`
  display: flex;
  gap: 0.5em;
`;

const NameWithIcon = styled.div`
  display: flex;
  gap: 0.3em;
  align-items: center;
`;

const verticallyMiddle = css`
  vertical-align: middle;
  border-radius: 50%;
  &:hover {
    opacity: 0.7;
  }
`;

const Name = styled.span`
  color: #e8e8e8;
  opacity: 0.7;
`;

const Collapsable = styled.div`
  height: max-content;
`;
