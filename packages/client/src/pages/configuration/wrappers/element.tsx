import { styled } from "@linaria/react";

type OptionProps = {
  icon: JSX.Element;
  onClick: () => void;
};

export const Option = ({ icon, onClick }: OptionProps) => {
  return <OptionElement onClick={onClick}>{icon}</OptionElement>;
};

const OptionElement = styled.span`
  cursor: pointer;
  display: flex;
  align-items: flex-end;
  padding: 0.1vh 0.1vw;
  color: #fff000;

  &:hover {
    filter: drop-shadow(0 0 3px #ff7f50);
  }
`;
