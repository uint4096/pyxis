import { Token, TokenType } from "./lexer";

export type Node =
  | {
      type: Exclude<TokenType, "text">;
      params: Array<Node>;
    }
  | {
      type: Extract<TokenType, "text">;
      value: string;
    };

export type AST = {
  type: "document";
  body: Array<Node>;
};

export const parser = (tokens: Array<Token>) => {
  let pointer = 0;
  const walk = (type?: string): Array<Node> => {
    const body: Array<Node> = [];
    while (pointer < tokens.length) {
      const token = tokens[pointer];
      switch (token?.type) {
        case "text": {
          body.push({ type: "text", value: token.value });
          pointer++;
          break;
        }
        case "bold&italic":
        case "bold":
        case "italic":
        case "strikethrough": {
          if (type === token?.type) {
            ++pointer;
            return body;
          }

          ++pointer;
          body.push({ type: token?.type, params: walk(token?.type) });
          break;
        }
      }
    }

    return body;
  };

  const ast = walk();
  return {
    type: "document",
    body: ast,
  };
};
