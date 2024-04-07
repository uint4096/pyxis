import { TOKEN_TEXT_MAP, textLength } from "../../../utils";
import { Node } from "./transpiler";

const findCharSum = (nodes: Array<Node>) =>
  nodes.reduce((sum, node): number => {
    const token = TOKEN_TEXT_MAP[node.type];
    return node.type === "text"
      ? (sum += textLength(node.value))
      : (token.prefix ? token.value.length : 0) +
          sum +
          findCharSum(node.params) +
          (token.suffix && node.closed ? token.value.length : 0);
  }, 0);

/**
 * Returns the starting position of the outermost ancestor
 * based on the caret position
 */
export const getStart = (childNodes: Array<Node>, caret: number) => {
  let start = 0;
  for (const node of childNodes) {
    const sum = findCharSum([node]);
    if (start + sum > caret) {
      return start;
    }

    start += sum;
  }

  return start;
};

/**
 * Returns the ending position of the outermost ancestor
 * based on the caret position
 */
export const getEnd = (childNodes: Array<Node>, caret: number) => {
  let end = 0;
  for (const node of childNodes) {
    const sum = findCharSum([node]);
    if (end + sum > caret) {
      end += sum;
      return end;
    }

    end += sum;
  }

  return end;
};
