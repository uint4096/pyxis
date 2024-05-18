import { getDescendant } from ".";
import { NODE_TEXT_MAP, textLength } from "../../../utils";

export const getCaretFromDomNodes = (
  base: Node,
  position: string,
  offset: number
) => {
  const elem = position ? getDescendant(base, position) : base;
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
        const prefix = nodeText?.prefix ? nodeText.value?.length : 0;

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
