export const insertTextAtPosition = (
  input: string,
  text: string,
  position: number
) => `${input.slice(0, position)}${text}${input.slice(position, input.length)}`;

export const wordPositon = (
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
