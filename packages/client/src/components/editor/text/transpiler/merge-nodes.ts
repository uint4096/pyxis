import { TOKEN_TEXT_MAP } from "../../../../utils";
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

export const mergeUnclosedNodes = (childNodes: Array<Node>) =>
  childNodes.reduce<Array<Node>>(
    (acc, node, idx) =>
      node.type !== "text" && !node.closed
        ? ((lastNode) =>
            lastNode
              ? lastNode?.type === "text"
                ? ((lastNode.value += getNodeContent(node)), acc)
                : acc
              : [{ type: "text", value: getNodeContent(node) }])(acc[idx - 1])
        : (acc.push(node), acc),
    []
  );
