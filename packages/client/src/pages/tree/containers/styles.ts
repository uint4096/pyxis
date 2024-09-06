import { css } from "@linaria/core";
import { styled } from "@linaria/react";

export const noDisplay = css`
  display: none;
`;

export const flexDisplay = css`
  display: flex;
`;

export const backgroundHover = css`
  background-color: #080808;
`;

export const OptionsContainer = styled.div`
  height: 100%;
  align-items: center;
  gap: 0.5vw;
`;

export const NameContainer = styled.div`
  padding: 0.2vh 0.3vw;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  gap: 0.1vw;
  border-radius: 5px;

  &:hover {
    background-color: #080808;
  }

  &:hover ${OptionsContainer} {
    display: flex;
  }
`;
