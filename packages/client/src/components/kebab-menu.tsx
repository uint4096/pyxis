import { css } from "@linaria/core";
import { styled } from "@linaria/react";
import { KeyboardEventHandler, forwardRef, useCallback } from "react";
import { GoKebabHorizontal } from "react-icons/go";
import { noop } from "../utils";

export type MenuOption = {
  id: string;
  name: string;
  handler: (name: string) => Promise<void>;
};

export type MenuProps = {
  options: Array<MenuOption>;
  showMenu: boolean;
  onClick: () => void;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
};

export const KebabMenu = forwardRef<HTMLDivElement, MenuProps>(
  ({ onClick, options, showMenu, onKeyDown }: MenuProps, ref) => {
    const onShow = useCallback(
      (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.stopPropagation();
        onClick();
      },
      [onClick]
    );

    return (
      <div ref={ref} onClick={onShow} onKeyDown={onKeyDown ?? noop} tabIndex={0}>
        <GoKebabHorizontal className={verticallyMiddle} />
        {showMenu && (
          <Menu>
            {options.map((option) => (
              <Option key={option.id}>{option.name}</Option>
            ))}
          </Menu>
        )}
      </div>
    );
  }
);

const verticallyMiddle = css`
  vertical-align: middle;
  border-radius: 50%;
  &:hover {
    opacity: 0.7;
  }
`;

const Menu = styled.div`
  position: absolute;
  padding: 0.5vh 0.5vw;
  background-color: #111;
  display: flex;
  flex-direction: column;
  gap: 0.2vh;
  border-radius: 5px;
`;

const Option = styled.div`
  padding: 0.5vh 1vw;
  &:hover {
    opacity: 0.8;
  }
`;
