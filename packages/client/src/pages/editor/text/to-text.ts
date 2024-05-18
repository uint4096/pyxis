type Nodes = "span" | "#text" | "strong" | "em" | "s" | "br" | "div";
type NodeTextMap = {
  [k in Nodes]: {
    type: "wrap" | "nowrap";
    value: string;
    skipWhenLast?: boolean;
  };
};

const NODE_TEXT_MAP: NodeTextMap = {
  span: { type: "nowrap", value: "" },
  "#text": { type: "nowrap", value: "" },
  strong: { type: "wrap", value: "**" },
  em: { type: "wrap", value: "*" },
  s: { type: "wrap", value: "~~" },
  br: { type: "nowrap", value: "" },
  div: { type: "nowrap", value: "\n" },
};

/*
 * There's no need for a lexer and parser here because
 * the output from DOMParser is the equivalent of an AST.
 *
 * CURRENTLY UNUSED!
 * But maybe I'll need it in future
 */
export const toText = (html: string) => {
  const parseNode = (nodeList: NodeList) => {
    let idx = 0,
      text = "";
    while (idx < nodeList.length) {
      const node = nodeList[idx];
      const content =
        node.nodeName === "#text" ? node.nodeValue : parseNode(node.childNodes);
      const sign =
        NODE_TEXT_MAP[<keyof typeof NODE_TEXT_MAP>node.nodeName.toLowerCase()];
      const isLastELem = node === nodeList[nodeList.length - 1];
      text += isLastELem
        ? `${content}`
        : sign.type === "wrap"
        ? `${sign.value}${content}${sign.value}`
        : `${content}${sign.value}`;
      idx++;
    }

    return text;
  };

  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");
  const body = document.childNodes[0].childNodes[1];
  return parseNode(body.childNodes);
};
