type ActionKeys = {
  [k: string]: (
    text: string,
    caretPosition: number,
    ctrl?: boolean
  ) => ActionResponse;
};
type ActionResponse = {
  text: string;
  caret: number;
};

const wordPositon = (text: string, position: number) => {
  let char = "",
    idx = position - 1,
    parsedChar = false;

  while (idx >= 0) {
    char = text[idx];
  
    if (!parsedChar && char !== " " && char !== '\n') {
      parsedChar = true;
    } else if (parsedChar && (char === " " || char === '\n')) {
      break;
    }

    idx--;
  }

  return idx + 1;
};

export const actions: ActionKeys = {
  Backspace: (text, caretPosition, ctrl) => {
    const start = ctrl ? wordPositon(text, caretPosition) : caretPosition - 1;

    return {
      text: `${text.slice(0, start)}${text.slice(caretPosition, text.length)}`,
      caret: start,
    };
  },
};
