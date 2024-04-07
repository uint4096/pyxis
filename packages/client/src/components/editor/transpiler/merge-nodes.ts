import { TOKEN_TEXT_MAP } from "../../../utils";
import { Node } from "./parser";

const getNodeContent = (node: Node) => {
  const token = TOKEN_TEXT_MAP[node.type];
  return node.type === "text"
    ? node.value
    : (token.prefix ? token.value : "") +
        node.params.reduce(
          (text, element): string => text + getNodeContent(element),
          ""
        ) +
        (token.suffix && node.closed ? token.value : "");
};

export const mergeUnclosedNodes = (childNodes: Array<Node>) => {
  return childNodes.reduce<Array<Node>>((acc, node, idx) => {
    if (node.type !== "text" && !node.closed) {
      const lastNode = acc[idx - 1];
      if (lastNode.type === "text") {
        lastNode.value += getNodeContent(node);
      }
    } else {
      acc.push(node);
    }

    return acc;
  }, []);
};
