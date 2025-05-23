import { getKeyContent } from "./content";
import {
  insertTextAtPosition,
  wordPositonBackward,
  wordPositonForward,
} from "../../../utils";
import { Keys } from "./mapping";

export type Caret = {
  start: number;
  end: number;
  collapsed: boolean;
};

type Handler = (text: string, caret: Caret, ctrl?: boolean) => ActionResponse;

type ActionKeys = {
  [k: string]: Handler;
};

type ActionResponse = {
  text: string;
  caret: Caret;
};

const actions: ActionKeys = {
  [Keys.BACKSPACE]: (text, caret, ctrl) => {
    const excludeChars = [" ", "\n", "-", "'", "(", ")"];
    const start =
      caret.collapsed && caret.start !== 0
        ? ctrl
          ? wordPositonBackward(text, caret.start, { excludeChars })
          : caret.start - 1
        : caret.start;

    return {
      text: `${text.slice(0, start)}${text.slice(caret.end, text.length)}`,
      caret: {
        start,
        end: start,
        collapsed: true,
      },
    };
  },
  [Keys.DELETE]: (text, caret, ctrl) => {
    const excludeChars = [" ", "\n", "-", "'", "(", ")"];
    const end = caret.collapsed
      ? ctrl
        ? wordPositonForward(text, caret.start, { excludeChars })
        : caret.start
      : caret.start;

    return {
      text: `${text.slice(0, caret.start)}${text.slice(end, text.length)}`,
      caret: {
        start: caret.start,
        end: caret.start,
        collapsed: true,
      },
    };
  },
};

const getter: { get: (target: typeof actions, key: string) => Handler } = {
  get(target, key) {
    return (text: string, caret: Caret, ctrl?: boolean) => {
      if (typeof target[key] === "function") {
        return Reflect.get(target, key)(text, caret, ctrl);
      }

      const content = getKeyContent(Keys[key]);
      return {
        text: insertTextAtPosition(text, content, caret.start, caret.end),
        caret: {
          start: caret.start + content.length,
          end: caret.start + content.length,
          collapsed: true,
        },
      };
    };
  },
};

export const Actions: ActionKeys = new Proxy(actions, getter);
