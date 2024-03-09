const NODE_TEXT_MAP = {
  span: "",
  "#text": "",
  b: "**",
  i: "*",
  s: "~~",
};

/*
 * There's no need for a lexer and parser here because
 * the output from DOMParser is the equivalent of an AST.
*/
export const toText = (html: string) => {
  const parseNode = (nodeList: NodeList) => {
    let idx = 0,
      text = "";
    while (idx < nodeList.length) {
      const node = nodeList[idx];
      const content =
        node.nodeName === "#text" ? node.nodeValue : parseNode(node.childNodes);
      const sign = `${
        NODE_TEXT_MAP[<keyof typeof NODE_TEXT_MAP>node.nodeName.toLowerCase()]
      }`;
      text += `${sign}${content}${sign}`;
      idx++;
    }

    return text;
  };

  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");
  const body = document.childNodes[0].childNodes[1];
  return parseNode(body.childNodes);
};
