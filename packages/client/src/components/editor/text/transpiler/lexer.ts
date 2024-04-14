export type Tokens =
  | "text"
  | "bold&italic"
  | "bold"
  | "italic"
  | "strikethrough"
  | "code"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "link";

export type Token = {
  type: Tokens;
  value: string;
  index: number;
};

type Pattern = {
  type: Tokens;
  pattern: RegExp;
  value: string;
  textOnly?: boolean;
  forceEnd?: boolean;
};

const getHeader = (text: string) => {
  let i = 0,
    token = "";
  while (i < text.length || text[i] !== "\n") {
    if (text[i] !== "#") {
      break;
    }

    token = `${token}#`;
    i++;
  }

  if (i <= 6 && text[i] === " ") {
    return { isHeader: true, type: `h${i}`, value: token };
  }

  return { isHeader: false };
};

const getLink = (text: string) => {
  const match = text.match(/(\bhttps?:\/\/|\bwww\.)\S+/i);
  return match?.[0];
};

const patterns: Readonly<Array<Pattern>> = [
  {
    type: "bold&italic",
    pattern: /(?<=^\*\*\*(?=[^\s]))(.*?)((?<!\s)\*\*\*|$)/,
    value: "***",
  },
  {
    type: "bold",
    pattern: /(?<=^\*\*(?=[^\s|*]))(.*?)((?<![\s|*])\*\*|$)/,
    value: "**",
  },
  {
    type: "italic",
    pattern: /(?<=^\*(?=[^\s|*]))(.*?)((?<![\s|*])\*|$)/,
    value: "*",
  },
  {
    type: "strikethrough",
    pattern: /(?<=^~~(?=[^\s]))(.*?)((?<!\s)~~|$)/,
    value: "~~",
  },
  { type: "code", pattern: /(?<=^`)(.*?)(`|$)/, value: "`", textOnly: true },
  {
    type: "link",
    pattern: /(^https?:\/\/|^www\.)\S+/i,
    value: "",
    textOnly: true,
    forceEnd: true,
  },
] as const;

export const lexer = (text: string) => {
  const walk = (text: string) => {
    const tokens: Array<Token> = [];
    let i = 0;
    while (i < text.length) {
      const txt = text.slice(i);
      const match = patterns.find(
        (match) => !!txt.match(new RegExp(match.pattern))?.[0]
      );
      if (match) {
        const _content = txt.match(new RegExp(match.pattern));
        const content = _content?.[0] as NonNullable<string>;
        tokens.push({ type: match.type, index: i, value: match.value });

        const hasEndNode = !!content.match(
          new RegExp(`${match.value.replace(/\*/g, "\\*")}$`)
        )?.[0];
        const textContent = hasEndNode
          ? content.replace(
              new RegExp(`${match.value.replace(/\*/g, "\\*")}$`),
              ""
            )
          : content;

        if (match.textOnly) {
          tokens.push({ type: "text", index: i, value: textContent });
        } else {
          tokens.push(...walk(textContent));
        }

        if (hasEndNode || match.forceEnd) {
          tokens.push({
            type: match.type,
            index: i + match.value.length + textContent.length,
            value: match.value,
          });
        }

        i +=
          (hasEndNode ? 2 * match.value.length : match.value.length) +
          textContent.length;
      } else {
        tokens.push({ type: "text", index: i, value: text[i] });
        i += 1;
      }
    }

    return tokens;
  };

  return walk(text);
};

export const lexer_v0 = (text: string) => {
  const syntaxTokens: Array<Token> = [];
  let i = 0;

  while (i < text.length) {
    switch (text[i]) {
      case "*":
      case "_": {
        if (text[i + 1] === text[i] && text[i + 2] === text[i]) {
          if (
            (text[i - 1] !== undefined && text[i - 1] !== " ") ||
            (text[i + 3] !== undefined && text[i + 3] !== " ")
          ) {
            syntaxTokens.push({
              type: "bold&italic",
              index: i,
              value: `${text[i]}${text[i]}${text[i]}`,
            });
          }

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
      case "`": {
        syntaxTokens.push({ type: "code", index: i, value: "`" });
        break;
      }
      case "#": {
        if (i !== 0 && text[i - 1] !== "\n") {
          break;
        }

        const { isHeader, type, value } = getHeader(text);
        if (!isHeader) {
          break;
        }

        syntaxTokens.push({
          type: <NonNullable<Tokens>>type,
          index: i,
          value: <NonNullable<string>>value,
        });

        i += (<NonNullable<string>>value)?.length - 1;

        break;
      }
      case "h": {
        const link = getLink(text.slice(i));
        if (!link) {
          break;
        }

        syntaxTokens.push({
          type: "link",
          index: i,
          value: "",
        });

        // Closing token so that text is extracted correctly
        syntaxTokens.push({
          type: "link",
          index: i + link.length,
          value: "",
        });

        i += link.length - 1;
      }
    }

    i += 1;
  }

  // Insert text nodes
  const tokens = syntaxTokens.reduce<Array<Token>>(
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
