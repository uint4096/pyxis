import { getDescendant } from ".";

const NODE_TEXT_MAP = {
  span: { type: "nowrap", value: "" },
  "#text": { type: "nowrap", value: "" },
  b: { type: "wrap", value: "**" },
  i: { type: "wrap", value: "*" },
  s: { type: "wrap", value: "~~" },
  br: { type: "nowrap", value: "\n" },
  div: { type: "nowrap", value: "\n" },
};

export const getCaretPosition = (
  base: Node,
  position: string,
  offset: number
) => {
  const elem = getDescendant(base, position);
  let foundNode = false;
  const parseNode = (nodeList: NodeList) => {
    let idx = 0,
      caretPosition = 0;
    while (idx < nodeList.length && !foundNode) {
      const node = nodeList[idx];
      const nodeText =
        NODE_TEXT_MAP[<keyof typeof NODE_TEXT_MAP>node.nodeName.toLowerCase()];
      if (node === elem) {
        foundNode = true;
        return caretPosition + offset;
      } else if (node.nodeName === "#text") {
        caretPosition += node.nodeValue?.length ?? 0;
      } else {
        caretPosition += nodeText.value?.length + parseNode(node.childNodes);
      }

      if (nodeText?.type === "wrap" && !foundNode) {
        caretPosition += nodeText?.value.length;
      }
      idx++;
    }

    return caretPosition;
  };

  // @Todo: Needs fixing. Does not work for initial text nodes
  return parseNode(base.childNodes) + 1;
};
