import { css } from "@linaria/core";
import { styled } from "@linaria/react";
import { HiPlus } from "react-icons/hi";
import { MdKeyboardArrowDown, MdKeyboardArrowRight } from "react-icons/md";
import { getOverflowMenu, type MenuOption } from "../../../components";
import { noop } from "../../../utils";
import { useCallback, useRef } from "react";
import type { Directory } from "../../../types";
import { useWorkspace } from "../../../store";
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
  overflowPopup: string;
};

export const DirContainer = ({
  collapsed,
  setCollapsed,
  dir,
  overflowPopup,
  setOverflowPopup,
}: DirContainerProps) => {
  const optionsRef = useRef<HTMLDivElement>(null);

  const DirOverflow = getOverflowMenu();

  const { removeEntity } = useWorkspace();

  const dirMenuOptions: Array<MenuOption> = [
    {
      handler: async () => noop(),
      id: "new_directory",
      name: "New Directory",
    },
    {
      handler: async () => {},
      id: "rename",
      name: "Rename",
    },
    {
      handler: useCallback(async () => removeEntity(dir), [dir, removeEntity]),
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
        <HiPlus className={verticallyMiddle} />
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
