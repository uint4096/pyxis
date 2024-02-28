export type TokenType =
  | "text"
  | "bold&italic"
  | "bold"
  | "italic"
  | "strikethrough";

export type Token = {
  type: TokenType;
  value: string;
  index: number;
};

export const lexer = (text: string) => {
  const syntaxTokens: Array<Token> = [];
  let i = 0;

  while (i < text.length) {
    switch (text[i]) {
      case "*":
      case "_": {
        if (text[i + 1] === text[i] && text[i + 2] === text[i]) {
          syntaxTokens.push({
            type: "bold&italic",
            index: i,
            value: `${text[i]}${text[i]}${text[i]}`,
          });
          i += 2;
        } else if (text[i + 1] === text[i]) {
          syntaxTokens.push({
            type: "bold",
            index: i,
            value: `${text[i]}${text[i]}`,
          });
          i += 1;
        } else {
          syntaxTokens.push({ type: "italic", index: i, value: `${text[i]}` });
        }

        break;
      }
      case "~": {
        if (text[i + 1] === "~")
          syntaxTokens.push({ type: "strikethrough", index: i, value: "~~" });
        i += 1;
        break;
      }
    }

    i += 1;
  }

  // Insert text nodes
  const tokens = syntaxTokens.reduce(
    (tokens, syntaxToken, index) => {
      tokens.push(syntaxToken);

      const textStart = syntaxToken.index + syntaxToken.value.length;
      if (textStart !== syntaxTokens[index + 1]?.index) {
        tokens.push({
          type: "text",
          index: textStart,
          value: text.slice(textStart, syntaxTokens[index + 1]?.index),
        });
      }

      return tokens;
    },
    [{ type: "text", index: 0, value: text.slice(0, syntaxTokens[0]?.index) }]
  );

  return tokens;
};
