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
`;
