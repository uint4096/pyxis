import { Token, TokenType } from "./lexer";

export type Node =
  | {
      type: Exclude<TokenType, "text">;
      params: Array<Node>;
      closed?: boolean;
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
  const walk = (type?: string) => {
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
            return { body, closed: true };
          }

          ++pointer;
          const { body: params, closed } = walk(token?.type);
          body.push({ type: token?.type, params: params, closed });
          break;
        }
      }
    }

    return { body, closed: false };
  };

  const ast = walk();
  return ast.body;
};
