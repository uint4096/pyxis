export const getDescendant = (base: Node, position: String) => {
  const positions = position.split(".").map((elem) => parseInt(elem, 10));
  return positions.reduce((node, position) => node.childNodes[position], base);
};
