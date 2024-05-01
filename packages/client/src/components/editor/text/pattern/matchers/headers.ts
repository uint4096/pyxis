import { Matcher } from "./types";

export const mHeaderFactory =
  (size: 1 | 2 | 3 | 4 | 5 | 6): Matcher =>
  (captureFunc) => ({
    ...captureFunc({
      initialPosition: size + 1,
      validator: (text) => text[size] === " " && !!text[size + 1],
    }),
    type: `h${size}`,
    value: Array.from({ length: size }, () => "#").join(""),
    textOnly: true,
    startOnly: true,
  });
