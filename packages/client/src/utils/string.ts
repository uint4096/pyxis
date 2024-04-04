import { ZERO_WIDTH_SPACE_UNICODE } from "./constants";

export const insertTextAtPosition = (
  input: string,
  text: string,
  start: number,
  end: number
) => `${input.slice(0, start)}${text}${input.slice(end, input.length)}`;

export const wordPositonBackward = (
  text: string,
  position: number,
  options?: { excludeChars: Array<string> }
) => {
  const { excludeChars } = options ?? {};

  let char = "",
    idx = position - 1,
    parsedChar = false;

  while (idx >= 0) {
    char = text[idx];

    if (!parsedChar && !(excludeChars ?? []).includes(char)) {
      parsedChar = true;
    } else if (parsedChar && (excludeChars ?? []).includes(char)) {
      break;
    }

    idx--;
  }

  return idx + 1;
};

export const wordPositonForward = (
  text: string,
  position: number,
  options?: { excludeChars: Array<string> }
) => {
  const { excludeChars } = options ?? {};

  let char = "",
    idx = position,
    parsedChar = false;

  while (idx < text.length) {
    char = text[idx];

    if (!parsedChar && !(excludeChars ?? []).includes(char)) {
      parsedChar = true;
    } else if (parsedChar && (excludeChars ?? []).includes(char)) {
      break;
    }

    idx++;
  }

  return idx;
};

export const textLength = (text?: string | null) =>
  (text?.length ?? 0) -
  (text?.match(new RegExp(ZERO_WIDTH_SPACE_UNICODE, "g")) ?? []).length;
