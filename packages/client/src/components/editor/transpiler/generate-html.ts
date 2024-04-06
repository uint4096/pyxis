import { transpile } from "./transpile";
import { NODE_TEXT_MAP, TOKEN_TEXT_MAP, ZERO_WIDTH_SPACE, textLength } from "../../../utils";
import { Token, lexer } from "./lexer";
import { Node, ElementNode, parser } from "./parser";
import { TOKEN_TAG_MAP } from "./to-html";

type SelectedElement = {
  element: string;
  offset: number;
};

export type Selection = {
  anchor: SelectedElement;
  focus: SelectedElement;
  collapsed: boolean;
};

type Content = {
  htmlContent: string;
  selection: Selection;
};

const findNodeCharSum = (node: NodeList[0]) => {
  const token =
    NODE_TEXT_MAP[<keyof typeof NODE_TEXT_MAP>node.nodeName.toLowerCase()];
  return node.nodeName === "#text"
    ? node.nodeValue?.length ?? 0
    : (token.prefix ? token.value.length : 0) +
        Array.from(node.childNodes).reduce(
          (sum, node): number => sum + findNodeCharSum(node),
          0
        ) +
        (token.suffix ? token.value.length : 0);
};

const findCharSum = (nodes: Array<Node>) =>
  nodes.reduce((sum, node): number => {
    const token = TOKEN_TEXT_MAP[node.type];
    return node.type === "text"
      ? (sum += node.value.length)
      : (token.prefix ? token.value.length : 0) +
          sum +
          findCharSum(node.params) +
          (token.suffix && node.closed ? token.value.length : 0);
  }, 0);

const getDomNodeStart = (nodes: NodeList, caret: number) => {
  let sum = 0;
  const nodeList = Array.from(nodes);
  for (const [idx, node] of nodeList.entries()) {
    const charSum = findNodeCharSum(node);
    if (sum + charSum >= caret) {
      return { position: idx, offset: sum }
    }

    sum += charSum;
  }

  return { position: nodeList.length - 1, offset: sum };
};

const getStart = (childNodes: Array<Node>, caret: number) => {
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

const getEnd = (childNodes: Array<Node>, caret: number) => {
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

const getNodeContent = (node: Node) => {
  const token = TOKEN_TEXT_MAP[node.type];
  return node.type === "text"
    ? node.value
    : (token.prefix ? token.value : "") +
        node.params.reduce(
          (text, element): string => text + getNodeContent(element),
          ""
        ) + (token.suffix && node.closed ? token.value : "");
};

const mergeUnclosedNodes = (childNodes: Array<Node>) => {
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

const getNodeSelection = (text: string, caret: number) => {
  const domParser = new DOMParser();
  const document = domParser.parseFromString(text, "text/html");
  const nodes = document.childNodes[0].childNodes[1].childNodes;
  return getDomNodeStart(nodes, caret);
}

export const getHTMLContent = (
  start: number,
  end: number,
  rawText: string
): Content => {
  const defaultSelection = {
    anchor: { element: "0", offset: 0 },
    focus: { element: "0", offset: 0 },
    collapsed: start === end,
  };

  const { html, selection } = rawText
    .split("\n")
    .reduce<{ html: string; parsed: number; selection: Selection }>(
      ({ html, parsed, selection }, line, idx) => {
        const lParsed = parsed + (idx ? 1 : 0);
        const toParse = lParsed + line.length;
        const startSelected = start >= lParsed && start <= toParse;
        const endSelected = end >= lParsed && end <= toParse;

        let text;
        if (startSelected || endSelected) {
          const lineStart = start - lParsed;
          const lineEnd = end - lParsed;
          const tokens = mergeUnclosedNodes(parser(lexer(line)));
          const startOverride = getStart(tokens, lineStart - 1);
          const endOverride = getEnd(tokens, lineEnd - 1);
          text = `${transpile(line.slice(0, startOverride))}${line.slice(
            startOverride,
            endOverride
          )}${transpile(line.slice(endOverride))}`;

          if (startSelected) {
            const { position, offset } = getNodeSelection(text, lineStart);
            selection.anchor = {
              element: `${idx}.${position < 0 ? 0 : position}`,
              offset: lineStart - offset
            }
          }

          if (endSelected) {
            const { position, offset } = getNodeSelection(text, lineEnd);
            selection.focus = {
              element: `${idx}.${position < 0 ? 0 : position}`,
              offset: lineEnd - offset
            } 
          }
        } else if (parsed > start && parsed < end) {
          text = line;
        } else {
          text = transpile(line);
        }

        return {
          html: `${html ? html : ""}<div>${
            text ? text : ZERO_WIDTH_SPACE
          }</div>`,
          parsed: toParse,
          selection: selection,
        };
      },
      { html: "", parsed: 0, selection: defaultSelection }
    );

  return {
    htmlContent: html,
    selection,
  };
};
