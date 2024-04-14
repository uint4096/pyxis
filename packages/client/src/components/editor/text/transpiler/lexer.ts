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
  textOnly?: boolean; // Should not contain any child elements
  forceEnd?: boolean; // Force adding a closing token after parsing an element
  startOnly?: boolean; // Should only be considered if the line begins with the token
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
  {
    type: "h1",
    pattern: /(?<=^#(?=[^#]))\s.*/,
    value: "#",
    textOnly: true,
    startOnly: true,
  },
  {
    type: "h2",
    pattern: /(?<=^##(?=[^#]))\s.*/,
    value: "##",
    textOnly: true,
    startOnly: true,
  },
  {
    type: "h3",
    pattern: /(?<=^###(?=[^#]))\s.*/,
    value: "###",
    textOnly: true,
    startOnly: true,
  },
  {
    type: "h4",
    pattern: /(?<=^####(?=[^#]))\s.*/,
    value: "####",
    textOnly: true,
    startOnly: true,
  },
  {
    type: "h5",
    pattern: /(?<=^#####(?=[^#]))\s.*/,
    value: "#####",
    textOnly: true,
    startOnly: true,
  },
  {
    type: "h6",
    pattern: /(?<=^######(?=[^#]))\s.*/,
    value: "######",
    textOnly: true,
    startOnly: true,
  },
] as const;

export const lexer = (text: string) => {
  const tokens: Array<Token> = [];
  let i = 0;
  while (i < text.length) {
    const txt = text.slice(i);
    const match = patterns.find(
      (match) => !!txt.match(new RegExp(match.pattern))?.[0]
    );

    if (match && (!match.startOnly || i === 0)) {
      const content = txt.match(new RegExp(match.pattern))?.[0] as NonNullable<string>;
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
        tokens.push(...lexer(textContent));
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
      const lastToken = tokens[tokens.length - 1];
      if (lastToken?.type === "text") {
        lastToken.value = lastToken.value + text[i];
      } else {
        tokens.push({ type: "text", index: i, value: text[i] });
      }
      i += 1;
    }
  }

  return tokens;
};
