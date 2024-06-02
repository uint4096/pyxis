export const getDescendant = (base: Node, position: string) =>
  position
    .split(".")
    .map((elem) => parseInt(elem, 10))
    .reduce((node, position) => node.childNodes[position], base);
