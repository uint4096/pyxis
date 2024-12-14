import { styled } from "@linaria/react";
import { ReactNode } from "react";

type OptionProps = {
  icon: JSX.Element;
  onClick: () => void;
};

export const Option = ({ icon, onClick }: OptionProps) => {
  return <OptionElement onClick={onClick}>{icon}</OptionElement>;
};

export type OptionsProps = {
  children: Array<ReactNode>;
};

export const Options = ({ children }: OptionsProps) => {
  return <OptionsWrapper>{children}</OptionsWrapper>;
};

const OptionElement = styled.span`
  cursor: pointer;
  display: flex;
  align-items: flex-end;
`;

const OptionsWrapper = styled.div`
  width: 90%;
  margin: auto;
  display: flex;
  justify-content: flex-start;
  gap: 2em;
  padding: 1em 0 0.5em 0;
`;
