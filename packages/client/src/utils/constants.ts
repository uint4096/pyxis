export const ZERO_WIDTH_SPACE = "&#8203";
export const ZERO_WIDTH_SPACE_UNICODE = "\u200B";

export const NODE_TEXT_MAP = {
  "": { prefix: false, suffix: false, value: "" },
  span: { prefix: false, suffix: false, value: "" },
  "#text": { prefix: false, suffix: false, value: "" },
  strong: { prefix: true, suffix: true, value: "**" },
  em: { prefix: true, suffix: true, value: "*" },
  s: { prefix: true, suffix: true, value: "~~" },
  br: { prefix: false, suffix: false, value: "" },
  div: { prefix: false, suffix: true, value: "\n" },
  code: { prefix: true, suffix: true, value: "`" },
  h1: { prefix: true, suffix: false, value: "#" },
  h2: { prefix: true, suffix: false, value: "##" },
  h3: { prefix: true, suffix: false, value: "###" },
  h4: { prefix: true, suffix: false, value: "####" },
  h5: { prefix: true, suffix: false, value: "#####" },
  h6: { prefix: true, suffix: false, value: "######" },
  a: { prefix: false, suffix: false, value: "" },
};

export const TOKEN_TEXT_MAP = {
  "bold&italic": { prefix: true, suffix: true, value: "***" },
  bold: { prefix: true, suffix: true, value: "**" },
  code: { prefix: true, suffix: true, value: "`" },
  h1: { prefix: true, suffix: false, value: "#" },
  h2: { prefix: true, suffix: false, value: "##" },
  h3: { prefix: true, suffix: false, value: "###" },
  h4: { prefix: true, suffix: false, value: "####" },
  h5: { prefix: true, suffix: false, value: "#####" },
  h6: { prefix: true, suffix: false, value: "######" },
  italic: { prefix: true, suffix: true, value: "*" },
  link: { prefix: false, suffix: false, value: "" },
  strikethrough: { prefix: true, suffix: true, value: "~~" },
  text: { prefix: false, suffix: false, value: "" },
};
