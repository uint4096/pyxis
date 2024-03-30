import { getDescendant } from ".";
import { ZERO_WIDTH_SPACE_UNICODE } from "../../../utils";

const NODE_TEXT_MAP = {
  span: { type: "nowrap", value: "" },
  "#text": { type: "nowrap", value: "" },
  strong: { type: "wrap", value: "**" },
  em: { type: "wrap", value: "*" },
  s: { type: "wrap", value: "~~" },
  br: { type: "nowrap", value: "" },
  div: { type: "nowrap", value: "\n" },
  line: { type: "nowrap", value: "" },
};

const textLength = (text?: string | null) =>
  (text?.length ?? 0) -
  (text?.match(new RegExp(ZERO_WIDTH_SPACE_UNICODE, "g")) ?? []).length;

export const getCaretFromDomNodes = (
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
        /*
         * When textLength returns 0, the line is empty. In that case we always
         * want to set the caret at the beginning of the line.
         */
        return caretPosition + (textLength(node.nodeValue) === 0 ? 0 : offset);
      } else if (node.nodeName === "#text") {
        /*
         * Using textLength here to make sure we don't take into account the
         * length of the zero width space character
         */
        caretPosition += textLength(node.nodeValue) ?? 0;
      } else {
        const prefix = nodeText?.type === "wrap" ? nodeText.value?.length : 0;

        caretPosition +=
          prefix +
          parseNode(node.childNodes) +
          (foundNode || (<any>node).hasAttribute("unclosed")
            ? 0
            : nodeText.value?.length);
      }

      idx++;
    }

    return caretPosition;
  };

  return parseNode(base.childNodes);
};
