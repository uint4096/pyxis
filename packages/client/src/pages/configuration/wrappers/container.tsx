import { ReactNode } from "react";
import { styled } from "@linaria/react";

type OptionsProps = {
  children: Array<ReactNode>;
};

export const Options = ({ children }: OptionsProps) => {
  return <OptionsWrapper>{children}</OptionsWrapper>;
};

const OptionsWrapper = styled.div`
  width: 90%;
  margin: auto;
  display: flex;
  justify-content: flex-start;
  gap: 2em;
  padding: 1em 0 0.5em 0;
`;
