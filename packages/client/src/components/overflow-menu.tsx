import { css } from "@linaria/core";
import { styled } from "@linaria/react";
import {
  ForwardedRef,
  KeyboardEventHandler,
  forwardRef,
  useCallback,
} from "react";
import { GoKebabHorizontal } from "react-icons/go";
import { noop } from "../utils";

export type MenuOption = {
  id: string;
  name: string;
  handler: () => void | Promise<void>;
};

export type MenuProps = {
  options: Array<MenuOption>;
  showMenu: boolean;
  onClick: () => void;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
};

function OverflowMenuWithRef(
  { onClick, options, showMenu, onKeyDown }: MenuProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const onShow = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      e.stopPropagation();
      onClick();
    },
    [onClick],
  );

  return (
    <div ref={ref} onClick={onShow} onKeyDown={onKeyDown ?? noop} tabIndex={0}>
      <GoKebabHorizontal className={verticallyMiddle} />
      {showMenu && (
        <Menu>
          {options.map((option) => (
            <Option key={option.id} onClick={() => option.handler()}>
              {option.name}
            </Option>
          ))}
        </Menu>
      )}
    </div>
  );
}

export const getOverflowMenu = () =>
  forwardRef<HTMLDivElement, MenuProps>(OverflowMenuWithRef);

const verticallyMiddle = css`
  vertical-align: middle;
  border-radius: 50%;
  &:hover {
    opacity: 0.7;
  }
`;

const Menu = styled.div`
  position: absolute;
  padding: 0.5vh 0vw;
  background-color: #111;
  opacity: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2vh;
  border-radius: 5px;
  border: 1px solid #27272a;
`;

const Option = styled.div`
  padding: 0.3vh 1.5vw 0.3vh 0.5vw;
  font-size: 0.9em;
  display: flex;
  opacity: 0.9;
  justify-content: flex-start;
  text-wrap: nowrap;
  &:hover {
    background-color: #27272a;
    opacity: 0.7;
  }
`;
