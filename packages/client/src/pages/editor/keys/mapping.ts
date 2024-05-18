const MappedKeys = {
  ESCAPE: "Escape",
  CONTROL: "Control",
  ALT: "Alt",
  SHIFT: "Shift",
  CAPSLOCK: "CapsLock",
  ENTER: "Enter",
  BACKSPACE: "Backspace",
  ARROW_RIGHT: "ArrowRight",
  ARROW_LEFT: "ArrowLeft",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  DELETE: "Delete",
  END: "End",
  HOME: "Home",
  PAGE_DOWN: "PageDown",
  PAGE_UP: "PageUp",
  TAB: "Tab",
  SUPER: "Super",
} as const;

const getter = {
  get(target: typeof MappedKeys, key: keyof typeof MappedKeys) {
    if (key in target) {
      return Reflect.get(target, key);
    }

    return key;
  },
};

export const Keys: typeof MappedKeys & { [k: string]: string } = new Proxy(
  MappedKeys,
  getter
);

export const selectionKeys: Array<string> = [
  Keys.ARROW_UP,
  Keys.ARROW_DOWN,
  Keys.ARROW_RIGHT,
  Keys.ARROW_LEFT,
  Keys.END,
  Keys.HOME,
  Keys.PAGE_DOWN,
  Keys.PAGE_UP,
];

export const ctrlSelectionKeys: Array<string> = [Keys.a, Keys.c];
export const ctrlSkipKeys: Array<string> = [Keys.v];
