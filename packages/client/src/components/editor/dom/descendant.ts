export const getDescendant = (base: Node, position: String) => {
  if (!position) {
    return base;
  }

  const positions = position.split(".").map((elem) => parseInt(elem, 10));
  return positions.reduce((node, position) => node.childNodes[position], base);
};
