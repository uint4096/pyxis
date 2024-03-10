// type Position = `${number}`;
// type NodePosition<T extends string> = T extends Position
//   ? T
//   : T extends `${Position}.${infer R}`
//   ? T extends `${infer F}.${R}`
//     ? `${F}.${NodePosition<R>}`
//     : never
//   : never;

export const getRelativeElementPosition = (
  base: Node,
  target: Node,
  position: string = ""
): string => {
  let idx = 0;
  while (idx < base.childNodes.length) {
    const node = base.childNodes[idx];
    if (node === target) {
      return `${position ? `${position}.` : ""}${idx}`;
    } else {
      const p = getRelativeElementPosition(
        node,
        target,
        `${position ? `${position}.` : ""}${idx}`
      );
      if (p) {
        return p;
      }
    }

    idx++;
  }

  return "";
};
