import { TokenType } from "./lexer";
import { Node } from "./parser";

const generateHTML = (type: TokenType, content: string) => {
  switch (type) {
    case "text": {
      return `${content}`;
    }
    case "bold": {
      return `<strong>${content}</strong>`;
    }
    case "italic": {
      return `<em>${content}</em>`;
    }
    case "bold&italic": {
      return `<strong><em>${content}</strong></em>`;
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
