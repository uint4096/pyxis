import { css } from "@linaria/core";
import { styled } from "@linaria/react";
import { HiPlus } from "react-icons/hi";
import { MdKeyboardArrowDown, MdKeyboardArrowRight } from "react-icons/md";
import { getOverflowMenu, type MenuOption } from "../../../components";
import { isFileInDir, noop } from "../../../utils";
import { useCallback, useRef } from "react";
import type { Directory, Document, File } from "../../../types";
import { useFile, useWorkspace } from "../../../store";
import {
  flexDisplay,
  NameContainer,
  noDisplay,
  OptionsContainer,
} from "./styles";

export type DirContainerProps = {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  dir: Directory;
  setOverflowPopup: React.Dispatch<React.SetStateAction<string>>;
  setNewDocument: React.Dispatch<React.SetStateAction<Document | undefined>>;
  overflowPopup: string;
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

  const { removeEntity } = useWorkspace();
  const { file: selectedFile, unselect } = useFile();

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
        if (selectedFile.name && isFileInDir(selectedFile as File, dir)) {
          unselect();
        }

        removeEntity(dir);
      }, [dir, removeEntity, selectedFile, unselect]),
      id: "delete",
      name: "Delete",
    },
  ];

  return (
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
        className={overflowPopup === dir.id ? flexDisplay : noDisplay}
      >
        <HiPlus
          className={verticallyMiddle}
          onClick={() => setNewDocument("file")}
        />
        <DirOverflow
          options={dirMenuOptions}
          onClick={() => setOverflowPopup(dir.id)}
          showMenu={dir.id === overflowPopup}
          onKeyDown={(e) =>
            e.key === "Escape" ? setOverflowPopup("") : noop()
          }
          ref={optionsRef}
        />
      </OptionsContainer>
    </NameContainer>
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
