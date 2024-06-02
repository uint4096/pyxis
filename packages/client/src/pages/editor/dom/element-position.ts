// type Position = `${number}`;
// type NodePosition<T extends string> = T extends Position
//   ? T
//   : T extends `${Position}.${infer R}`
//   ? T extends `${infer F}.${R}`
//     ? `${F}.${NodePosition<R>}`
//     : never
//   : never;

/**
 * Returns address of the target element relative to the base element
 */
export const getRelativeElementPosition = (
  base: Node,
  target: Node,
  position: string = "",
): string =>
  Array.from(base.childNodes).reduce<string | undefined>(
    (acc, node, idx) =>
      acc
        ? acc
        : node === target
          ? `${position ? `${position}.` : ""}${idx}`
          : getRelativeElementPosition(
              node,
              target,
              `${position ? `${position}.` : ""}${idx}`,
            ),
    "",
  ) ?? "";
