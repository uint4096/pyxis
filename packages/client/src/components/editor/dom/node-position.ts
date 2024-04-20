import { NODE_TEXT_MAP, textLength } from "../../../utils";

const findNodeCharSum = (node: NodeList[0]) => {
  const token =
    NODE_TEXT_MAP[<keyof typeof NODE_TEXT_MAP>node.nodeName.toLowerCase()];
  return node.nodeName === "#text"
    ? textLength(node.nodeValue) ?? 0
    : (token.prefix ? token.value.length : 0) +
        Array.from(node.childNodes).reduce(
          (sum, node): number => sum + findNodeCharSum(node),
          0
        ) +
        (token.suffix && !(<any>node).hasAttribute("unclosed")
          ? token.value.length
          : 0);
};

export const _nodePosition = (nodes: NodeList, caret: number) => {
  let sum = 0;
  const nodeList = Array.from(nodes);
  for (const [idx, node] of nodeList.entries()) {
    const charSum = findNodeCharSum(node);
    if (sum + charSum >= caret) {
      return { position: idx, chars: sum };
    }

    sum += charSum;
  }

  return { position: nodeList.length - 1, chars: sum };
};

/**
 * Returns the position of the dom node based on the caret
 * position before the line was transpiled. Also returns the
 * total number of text characters excluding the current node.
 */
export const nodePosition = (text: string, caret: number) => {
  const domParser = new DOMParser();
  const document = domParser.parseFromString(text, "text/html");
  const nodes = document.childNodes[0].childNodes[1].childNodes;
  return _nodePosition(nodes, caret);
};
