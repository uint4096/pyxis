export const getDescendant = (base: Node, position: String) =>
  position
    .split(".")
    .map((elem) => parseInt(elem, 10))
    .reduce((node, position) => node.childNodes[position], base);
