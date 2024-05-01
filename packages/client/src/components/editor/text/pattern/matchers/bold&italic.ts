import { type Matcher } from "./types";

export const mBoldAndItalic: Matcher = (captureFunc) => ({
  ...captureFunc({
    breakingCondition: (text, pointer) =>
      text[pointer] !== " " &&
      text[pointer + 1] === "*" &&
      text[pointer + 2] === "*" &&
      text[pointer + 3] === "*",
    initialPosition: 3,
    validator: (text) => !!text[3] && text[3] !== " ",
  }),
  type: "bold&italic",
  value: "***",
});
