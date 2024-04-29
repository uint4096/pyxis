import { Tokens } from "./text/transpiler/lexer";

const mCode = (text: string) => {
  let pointer = 1, capture = '';
  while (pointer < text.length) {
    if (text[pointer] === '`') {
      break;
    }
    capture += text[pointer];
    pointer += 1;
  }

  return {
    type: "code" as Tokens,
    value: "`",
    textOnly: true,
    capture,
    startOnly: false,
    forceEnd: false,
    hasEndNode: pointer !== text.length
  };
}

const mStrike = (text: string) => {
  if (text[1] !== '~') {
    return null;
  }

  let pointer = 2, capture = '';
  while (pointer < text.length) {
    if (text[pointer] !== ' ' && text[pointer + 1] === '~' && text[pointer + 2] === '~') {
      capture += text[pointer];
      break;
    }
    capture += text[pointer];
    pointer += 1;
  }

  return {
    type: "strikethrough" as Tokens,
    value: "~~",
    textOnly: false,
    capture,
    startOnly: false,
    forceEnd: false,
    hasEndNode: pointer !== text.length
  }; 
}

const matchers = {
  '`': mCode,
  '~': mStrike
}

export const patternMatcher = (text: string) => {
  const key = text[0] as keyof typeof matchers;
  return matchers[key] ? matchers[key](text) : null;
}
