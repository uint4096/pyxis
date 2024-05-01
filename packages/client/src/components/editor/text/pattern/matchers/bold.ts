import { Matcher } from "./types";

export const mBold: Matcher = (captureFunc) => ({
  ...captureFunc({
    breakingCondition: (text, pointer) =>
      text[pointer] !== " " &&
      text[pointer + 1] === "*" &&
      text[pointer + 2] === "*",
    initialPosition: 2,
    validator: (text) => !!text[2] && text[2] !== " ",
  }),
  type: "bold",
  value: "**",
});
