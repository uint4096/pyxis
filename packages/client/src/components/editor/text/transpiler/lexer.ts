import { matchContent } from "../pattern";
import { type Tokens } from "../types";

export type Token = {
  type: Tokens;
  value: string;
  index: number;
  position?: "start" | "end";
};

export const lexer = (text: string, idx = 0) => {
  const tokens: Array<Token> = [];
  let i = 0;

  while (i < text.length) {
    const txt = text.slice(i);
    const match = matchContent(txt);

    if (
      match &&
      match.type !== "text" &&
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
