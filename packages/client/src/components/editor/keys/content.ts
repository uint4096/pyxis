import { Keys } from "./mapping";

export const getKeyContent = (key: string) => {
  switch (key) {
    case Keys.ENTER: {
      return "\n";
    }
    case Keys.CONTROL:
    case Keys.SHIFT:
    case Keys.ALT:
    case Keys.CAPSLOCK:
    case Keys.ESCAPE: {
      return "";
    }
    default: {
      return Keys[key];
    }
  }
};
