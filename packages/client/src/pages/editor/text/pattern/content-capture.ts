import { iterator } from "./iterator";
import { mLink, matchers } from "./matchers";

export const matchContent = (text: string) => {
  const getCapture = iterator(text);
  const key = <keyof typeof matchers>(
    (["*", "#"].includes(text[0])
      ? text.match(/^(.)\1*/)?.[0] ?? text[0]
      : text[0])
  );
  const pattern = matchers[key] ? matchers[key](getCapture) : null;
  if (!pattern || !pattern.capture) {
    if (text[0] === "h") {
      return mLink(text);
    }

    return null;
  }

  return pattern;
};
