type ActionKeys = {
  [k: string]: (
    text: string,
    caretPosition: number,
    ctrl?: boolean
  ) => ActionResponse;
};
type ActionResponse = {
  text: string;
  caretPosition: number;
};

const wordPositon = (text: string, position: number) => {
  let char = "",
    idx = position;
  while (char !== " " && idx >= 0) {
    char = text[idx];
    idx--;
  }

  return idx;
};

export const actions: ActionKeys = {
  Backspace: (text, caretPosition, ctrl) => {
    const start = ctrl ? wordPositon(text, caretPosition) : caretPosition - 1;

    return {
      text: `${text.slice(0, start)}${text.slice(caretPosition, text.length)}`,
      caretPosition: start,
    };
  },
};
