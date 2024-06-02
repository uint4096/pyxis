import { type Tokens } from "../types";
import { type Token } from "./lexer";

export type ElementNode = {
  type: Exclude<Tokens, "text">;
  params: Array<Node>;
  closed: boolean;
};

export type TextNode = {
  type: Extract<Tokens, "text">;
  value: string;
};

export type Node = TextNode | ElementNode;

export type AST = {
  type: "document";
  body: Array<Node>;
};

export const parser = (tokens: Array<Token>): Array<Node> => {
  let pointer = 0;
  const body: Array<Node> = [];
  while (pointer < tokens.length) {
    const token = tokens[pointer];
    if (token.type === "text") {
      body.push({ type: "text", value: token.value });
      pointer += 1;
    } else if (token.position === "start") {
      const tokenEnd = tokens.findIndex(
        (tkn, idx) =>
          tkn.type === token.type && tkn.position === "end" && idx > pointer,
      );
      const tokensToProcess =
        tokenEnd > -1
          ? tokens.slice(pointer + 1, tokenEnd)
          : tokens.slice(pointer + 1);

      body.push({
        type: token.type,
        params: parser(tokensToProcess),
        closed: tokenEnd > -1,
      });
      pointer += tokensToProcess.length + 1;
    } else {
      pointer += 1;
    }
  }

  return body;
};
