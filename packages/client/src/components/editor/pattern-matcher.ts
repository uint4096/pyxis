import { Tokens } from "./text/transpiler/lexer";

type LexerPattern = {
  capture: string;
  value: string;
  type: Tokens;
  hasEndNode?: boolean;
  textOnly?: boolean;
  startOnly?: boolean;
  forceEnd?: boolean;
};

type Matcher = (captureFunc: ReturnType<typeof iterator>) => LexerPattern;

const iterator =
  (text: string) =>
  ({
    initialPosition,
    validator,
    breakingCondition,
  }: {
    initialPosition: number;
    validator: (text: string) => boolean;
    breakingCondition?: (text: string, pointer: number) => boolean;
  }) => {
    if (!validator(text)) {
      return { capture: "" };
    }

    let pointer = initialPosition,
      capture = "";

    while (pointer < text.length) {
      if (breakingCondition?.(text, pointer)) {
        capture += text[pointer];
        break;
      }

      capture += text[pointer];
      pointer += 1;
    }

    return { capture: capture, hasEndNode: pointer !== text.length };
  };

const mCode: Matcher = (captureFunc) => ({
  ...captureFunc({
    breakingCondition: (text, pointer) => text[pointer + 1] === "`",
    initialPosition: 1,
    validator: (text) => !!text[1],
  }),
  type: "code",
  value: "`",
  textOnly: true,
});

const mStrike: Matcher = (captureFunc) => ({
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

const mBoldAndItalic: Matcher = (captureFunc) => ({
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

const mBold: Matcher = (captureFunc) => ({
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

const mItalic: Matcher = (captureFunc) => ({
  ...captureFunc({
    breakingCondition: (text, pointer) =>
      text[pointer] !== " " && text[pointer + 1] === "*",
    initialPosition: 1,
    validator: (text) => !!text[1] && text[1] !== " ",
  }),
  type: "italic",
  value: "*",
});

const mHeaderFactory =
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

const mLink = (text: string) => {
  const capture = text.match(/(^https?:\/\/|^www\.)\S+/i)?.[0];

  if (!capture) {
    return null;
  }

  return {
    type: "link" as Tokens,
    value: "",
    textOnly: true,
    capture,
    startOnly: false,
    forceEnd: true,
    hasEndNode: true,
  };
};

const matchers = {
  "`": mCode,
  "~": mStrike,
  "*": mItalic,
  "**": mBold,
  "***": mBoldAndItalic,
  "#": mHeaderFactory(1),
  "##": mHeaderFactory(2),
  "###": mHeaderFactory(3),
  "####": mHeaderFactory(4),
  "#####": mHeaderFactory(5),
  "######": mHeaderFactory(6),
};

export const patternMatcher = (text: string) => {
  const getCapture = iterator(text);
  const key = <keyof typeof matchers>(
    (["*", "#"].includes(text[0])
      ? text.match(/^(.)\1*/)?.[0] ?? text[0]
      : text[0])
  );
  const pattern = matchers[key] ? matchers[key](getCapture) : null;
  if (!pattern || !pattern.capture) {
    if (text[0] === 'h') {
      return mLink(text);
    }

    return null;
  }

  return pattern;
};
