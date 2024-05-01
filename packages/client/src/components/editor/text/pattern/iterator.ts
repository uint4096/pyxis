export const iterator =
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
