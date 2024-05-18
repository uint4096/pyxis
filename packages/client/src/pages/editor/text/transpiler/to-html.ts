import { NODE_TEXT_MAP } from "../../../../utils";
import { type Tokens } from "../types";
import { type Node } from "./parser";

type Attributes = Record<string, string | boolean>;

type HTMLProperties = {
  tag: keyof typeof NODE_TEXT_MAP;
  contentOverride?: (content: string, attributes: Attributes) => string;
  attributeOverride?: (content: string, attributes: Attributes) => Attributes;
};

const getTag = (tag: string, content: string, attributeList: Attributes) => {
  if (!tag) {
    return content;
  }

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

  return `<${tag}${attr}>${content}</${tag}>`;
};

export const TOKEN_TAG_MAP: { [k in Tokens]: HTMLProperties } = {
  "bold&italic": {
    tag: "strong",
    contentOverride: (content, attributes) => getTag("em", content, attributes),
  },
  bold: { tag: "strong" },
  code: { tag: "code" },
  h1: { tag: "h1" },
  h2: { tag: "h2" },
  h3: { tag: "h3" },
  h4: { tag: "h4" },
  h5: { tag: "h5" },
  h6: { tag: "h6" },
  italic: { tag: "em" },
  link: {
    tag: "a",
    attributeOverride: (content, attributes) => ({
      ...attributes,
      href: content,
    }),
  },
  strikethrough: { tag: "s" },
  text: { tag: "" },
};

const generateHTML = (type: Tokens, content: string, closed?: boolean) => {
  const attributes = {
    unclosed: !closed,
  };

  const { tag, contentOverride, attributeOverride } = TOKEN_TAG_MAP[type];

  return getTag(
    tag,
    contentOverride?.(content, attributes) ?? content,
    attributeOverride?.(content, attributes) ?? attributes
  );
};

export const toHtml = (ast: Array<Node>): string =>
  ast.reduce(
    (html, node) => (
      (html += generateHTML(
        node.type,
        node.type === "text" ? node.value : toHtml(node.params),
        (<Node & { closed?: boolean }>node).closed
      )),
      html
    ),
    ""
  );
