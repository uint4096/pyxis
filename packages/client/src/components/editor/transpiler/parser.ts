import { Token } from "./lexer";

export type Node = any;
export type AST = {
  type: 'document';
  body: Array<Node>;
};

export const parser = (tokens: Array<Token>) => {
  let pointer = 0;
  const walk = (type?: string): Array<Node> => {
    const body = [];
    while (pointer < tokens.length) {
      const token = tokens[pointer];
      switch (token?.type) {
        case "text": {
          body.push(token);
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
    type: 'document',
    body: ast
  };
};
