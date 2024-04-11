import { Token, Tokens } from "./lexer";

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

export const parser = (tokens: Array<Token>) => {
  let pointer = 0;
  const walk = (type?: string) => {
    const body: Array<Node> = [];
    while (pointer < tokens.length) {
      const token = tokens[pointer];
      if (token?.type === "text") {
        body.push({ type: "text", value: token.value });
        pointer++;
      } else if (token?.type === "code") {
        // Everything until the end of code token is text
        const endToken = tokens.findIndex(
          (token, i) => i > pointer && token.type === "code"
        );
        const text = tokens
          .slice(pointer + 1, endToken === -1 ? tokens.length : endToken)
          .reduce((text, token) => text + token.value, "");
        body.push({
          type: "code",
          params: [{ type: "text", value: text }],
          closed: endToken !== -1,
        });
        pointer = endToken === -1 ? tokens.length : endToken + 1;
      } else {
        if (type === token?.type) {
          ++pointer;
          return { body, closed: true };
        }

        ++pointer;
        const { body: params, closed } = walk(token?.type);
        body.push({ type: token?.type, params: params, closed });
      }
    }

    return { body, closed: false };
  };

  const ast = walk();
  return ast.body;
};
