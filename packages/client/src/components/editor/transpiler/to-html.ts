import { TokenType } from "./lexer";
import { Node } from "./parser";

const getTag = (
  tag: string,
  content: string,
  attributeList: Record<string, string | boolean>
) => {
  const attr = Object.entries(attributeList).reduce(
    (attributes, [key, value]) => {
      if (typeof value === "string") {
        attributes = `${attributes} ${key}="${value}"`;
      } else {
        if (value) {
          attributes += `${attributes} ${key}`;
        }
      }

      return attributes;
    },
    ""
  );

  return `<${tag} ${attr}>${content}</${tag}>`;
};

const generateHTML = (type: TokenType, content: string, closed?: boolean) => {
  const attributes = {
    unclosed: !closed,
  };

  switch (type) {
    case "text": {
      return `${content}`;
    }
    case "bold": {
      return getTag("strong", content, attributes);
    }
    case "italic": {
      return getTag("em", content, attributes);
    }
    case "bold&italic": {
      return getTag("strong", getTag("em", content, attributes), attributes);
    }
    case "strikethrough": {
      return getTag("s", content, attributes);
    }
    case "code":
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6": {
      return getTag(type, content, attributes);
    }
    case "link": {
      return getTag("a", content, { ...attributes, href: content });
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
