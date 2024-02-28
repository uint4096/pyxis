import { TokenType } from "./lexer";
import { AST, Node } from "./parser";

const generateHTML = (type: TokenType, content: string) => {
  switch (type) {
    case "text": {
      return `<span>${content}</span>`;
    }
    case "bold": {
      return `<b>${content}</b>`;
    }
    case "italic": {
      return `<i>${content}</i>`;
    }
    case "bold&italic": {
      return `<b><i>${content}</i></b>`;
    }
    case "strikethrough": {
      return `<s>${content}</s>`;
    }
    default: {
      return "";
    }
  }
};

export const toHtml = (ast: Array<Node>) =>
  ast.reduce((html, node) => {
    if (node.type === "text") {
      html += generateHTML("text", node.value);
    } else {
      html += generateHTML(node.type, toHtml(node.params));
    }
    return html;
  }, "");
