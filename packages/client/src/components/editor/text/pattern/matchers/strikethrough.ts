import { type Matcher } from "./types";

export const mStrike: Matcher = (captureFunc) => ({
  ...captureFunc({
    breakingCondition: (text, pointer) =>
      text[pointer] !== " " &&
      text[pointer + 1] === "~" &&
      text[pointer + 2] === "~",
    initialPosition: 2,
    validator: (text) => text[1] === "~" && !!text[2] && text[2] !== " ",
  }),
  type: "strikethrough",
  value: "~~",
});
