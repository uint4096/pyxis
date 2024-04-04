export const ZERO_WIDTH_SPACE = "&#8203";
export const ZERO_WIDTH_SPACE_UNICODE = "\u200B";

export const NODE_TEXT_MAP = {
  span: { prefix: false, value: "" },
  "#text": { prefix: false, value: "" },
  strong: { prefix: true, value: "**" },
  em: { prefix: true, value: "*" },
  s: { prefix: true, value: "~~" },
  br: { prefix: false, value: "" },
  div: { prefix: false, value: "\n" },
  code: { prefix: true, value: "`" },
  h1: { prefix: true, value: "#" },
  h2: { prefix: true, value: "##" },
  h3: { prefix: true, value: "###" },
  h4: { prefix: true, value: "####" },
  h5: { prefix: true, value: "#####" },
  h6: { prefix: true, value: "######" },
  a: { prefix: false, value: "" },
};
