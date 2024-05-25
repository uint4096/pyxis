import { css } from "@linaria/core";
import { styled } from "@linaria/react";
import { useCallback, useState } from "react";
import { GoKebabHorizontal } from "react-icons/go";

export type MenuOption = {
  id: string;
  name: string;
  handler: (name: string) => Promise<void>;
};

export type MenuProps = {
  options: Array<MenuOption>;
  onClickHook: () => void;
};

export const KebabMenu = ({ options, onClickHook }: MenuProps) => {
  const [showMenu, setMenu] = useState(false);

  const onClick = useCallback(() => {
    onClickHook();
    setMenu((menu) => !menu);
  }, []);

  return (
    <MenuWrapper>
      <GoKebabHorizontal onClick={onClick} className={verticallyMiddle}/>
      {showMenu && (
        <Menu>
          {options.map((option) => (
            <Option key={option.id}>{option.name}</Option>
          ))}
        </Menu>
      )}
    </MenuWrapper>
  );
};

const MenuWrapper = styled.div``;

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
