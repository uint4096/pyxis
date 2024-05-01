import { Tokens } from "../../types";
import { iterator } from "../iterator";

type LexerPattern = {
  capture: string;
  value: string;
  type: Tokens;
  hasEndNode?: boolean;
  textOnly?: boolean;
  startOnly?: boolean;
  forceEnd?: boolean;
};

export type Matcher = (
  captureFunc: ReturnType<typeof iterator>
) => LexerPattern;
