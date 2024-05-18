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
    case Keys.TAB:
    case Keys.ESCAPE:
    case Keys.SUPER:
    case Keys.F1:
    case Keys.F2:
    case Keys.F3:
    case Keys.F4:
    case Keys.F5:
    case Keys.F6:
    case Keys.F7:
    case Keys.F8:
    case Keys.F9:
    case Keys.F10:
    case Keys.F11:
    case Keys.F12: {
      return "";
    }
    default: {
      return Keys[key];
    }
  }
};
