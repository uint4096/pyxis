import { Matcher } from "./types";

export const mCode: Matcher = (captureFunc) => ({
  ...captureFunc({
    breakingCondition: (text, pointer) => text[pointer + 1] === "`",
    initialPosition: 1,
    validator: (text) => !!text[1],
  }),
  type: "code",
  value: "`",
  textOnly: true,
});
