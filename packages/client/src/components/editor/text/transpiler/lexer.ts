import { patternMatcher } from "../../pattern-matcher";

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
  position?: "start" | "end";
};

type Pattern = {
  type: Tokens;
  pattern: RegExp;
  value: string;
  secondaryPattern?: RegExp;
  textOnly?: boolean; // Should not contain any child elements
  forceEnd?: boolean; // Force adding a closing token after parsing an element
  startOnly?: boolean; // Should only be considered if the line begins with the token
};

const patterns: Readonly<Array<Pattern>> = [
  {
    type: "text",
    pattern: new RegExp("^(?!.*[~*`#]|.*(?:http[s]?://|www\.)).*$"),
    value: "" 
  },
  {
    type: "code",
    pattern: /(?<=^`)(.*?)(?=`|$)/,
    secondaryPattern: /(?<=^`)(.*?)$/,
    value: "`",
    textOnly: true,
  },
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
  {
    type: "bold&italic",
    pattern: /(?<=^\*\*\*(?=[^\s]))(.*?)(?=(?<!\s)\*\*\*)/,
    secondaryPattern: /(?<=^\*\*\*(?=[^\s]))(.*?)$/,
    value: "***",
  },
  {
    type: "bold",
    pattern: /(?<=^\*\*(?=[^\s]))(.*?)(?=(?<!\s)\*\*)/,
    secondaryPattern: /(?<=^\*\*(?=[^\s|*]))(.*?)$/,
    value: "**",
  },
  {
    type: "italic",
    pattern: /(?<=^\*(?=[^\s|*]))(.*?)(?=(?<![\s|*])\*)/,
    secondaryPattern: /(?<=^\*(?=[^\s|*]))(.*?)$/,
    value: "*",
  },
  {
    type: "strikethrough",
    pattern: /(?<=^~~(?=[^\s]))(.*?)(?=(?<!\s)~~)/,
    secondaryPattern: /(?<=^~~(?=[^\s]))(.*?)$/,
    value: "~~",
  },
] as const;

export const lexer = (text: string, idx = 0) => {
  const tokens: Array<Token> = [];
  let i = 0;

  while (i < text.length) {
    const txt = text.slice(i);
    const match = patternMatcher(txt);

    if (
      match && match.type !== 'text' &&
      (!match.startOnly || (match.startOnly && idx === 0 && i === 0))
    ) {
      const content = match.capture;

      tokens.push({
        type: match.type,
        index: i + idx,
        value: match.value,
        position: "start",
      });

      const hasEndNode = !!match.hasEndNode && !match.startOnly;

      if (match.textOnly) {
        tokens.push({
          type: "text",
          index: i + idx + match.value.length,
          value: content,
        });
      } else {
        tokens.push(...lexer(content, i + idx + match.value.length));
      }

      if (hasEndNode || match.forceEnd) {
        tokens.push({
          type: match.type,
          index: i + idx + match.value.length + content.length,
          value: match.value,
          position: "end",
        });
      }

      i +=
        (hasEndNode ? 2 * match.value.length : match.value.length) +
        content.length;
    } else {
      const lastToken = tokens[tokens.length - 1];
      if (lastToken?.type === "text") {
        lastToken.value = lastToken.value + text[i];
      } else {
        tokens.push({ type: "text", index: idx + i, value: text[i] });
      }
      i += 1;
    }
  }

  return tokens;
};
