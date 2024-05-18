import { type Matcher } from "./types";

export const mItalic: Matcher = (captureFunc) => ({
  ...captureFunc({
    breakingCondition: (text, pointer) =>
      text[pointer] !== " " && text[pointer + 1] === "*",
    initialPosition: 1,
    validator: (text) => !!text[1] && text[1] !== " ",
  }),
  type: "italic",
  value: "*",
});
