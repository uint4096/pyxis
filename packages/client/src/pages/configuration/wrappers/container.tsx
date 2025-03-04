import { ReactNode } from "react";
import { styled } from "@linaria/react";

type OptionsProps = {
  children: Array<ReactNode>;
};

export const Options = ({ children }: OptionsProps) => {
  return <OptionsWrapper>{children}</OptionsWrapper>;
};

const OptionsWrapper = styled.div`
  height: 100%;
  display: flex;
  background-color: #040404;
  flex-direction: column;
  justify-content: flex-end;
  gap: 2em;
  border-right: 0.5px dotted gray;
  padding: 2vh 0.5vw;
  color: #e8e8e8;
  z-index: 1000;
`;
