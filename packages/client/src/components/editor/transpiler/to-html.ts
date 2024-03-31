import { TokenType } from "./lexer";
import { Node } from "./parser";

const getTag = (tag: string, content: string, closed?: boolean) =>
  closed
    ? `<${tag}>${content}</${tag}>`
    : `<${tag} unclosed>${content}</${tag}>`;

const generateHTML = (type: TokenType, content: string, closed?: boolean) => {
  switch (type) {
    case "text": {
      return `${content}`;
    }
    case "bold": {
      return getTag("strong", content, closed);
    }
    case "italic": {
      return getTag("em", content, closed);
    }
    case "bold&italic": {
      return getTag("strong", getTag("em", content, closed), closed);
    }
    case "strikethrough": {
      return getTag("s", content, closed);
    }
    case "code":
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6": {
      return getTag(type, content, closed);
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
      html += generateHTML(node.type, toHtml(node.params), node.closed);
    }
    return html;
  }, "");
