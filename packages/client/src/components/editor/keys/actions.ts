import { getKeyContent } from "./content";
import { insertTextAtPosition, wordPositon } from "../../../utils";
import { Keys } from "./mapping";

type Handler = (
  text: string,
  caretPosition: number,
  ctrl?: boolean
) => ActionResponse;

type ActionKeys = {
  [k: string]: Handler;
};

type ActionResponse = {
  text: string;
  caret: number;
};

const actions: ActionKeys = {
  [Keys.BACKSPACE]: (text, caretPosition, ctrl) => {
    const excludeChars = [" ", "\n", "-", "'", "(", ")"];
    const start = ctrl
      ? wordPositon(text, caretPosition, { excludeChars })
      : caretPosition - 1;

    return {
      text: `${text.slice(0, start)}${text.slice(caretPosition, text.length)}`,
      caret: start,
    };
  },
};

const getter: { get: (target: typeof actions, key: string) => Handler } = {
  get(target, key) {
    return (text: string, caretPosition: number, ctrl?: boolean) => {
      if (typeof target[key] === "function") {
        return Reflect.get(target, key)(text, caretPosition, ctrl);
      }

      const content = getKeyContent(Keys[key]);
      return {
        text: insertTextAtPosition(text, content, caretPosition),
        caret: caretPosition + content.length,
      };
    };
  },
};

export const Actions: ActionKeys = new Proxy(actions, getter);
