import { transpile } from "./transpile";
import { ZERO_WIDTH_SPACE, textLength } from "../../../utils";
import { lexer } from "./lexer";
import { parser } from "./parser";
import { nodePosition } from "../dom";
import { getEnd, getStart } from "./tracker";
import { mergeUnclosedNodes } from "./merge-nodes";

type SelectedElement = {
  element: string;
  offset: number;
};

export type Selection = {
  anchor: SelectedElement;
  focus: SelectedElement;
  collapsed: boolean;
};

type Content = {
  html: string;
  selection: Selection;
};

export const getHTMLContent = (
  start: number,
  end: number,
  rawText: string
): Content =>
  rawText
    .split("\n")
    .reduce<{ html: string; parsed: number; selection: Selection }>(
      ({ html, parsed, selection }, line, idx) => {
        const lParsed = parsed + (idx ? 1 : 0);
        const toParse = lParsed + textLength(line);
        const startSelected = start >= lParsed && start <= toParse;
        const endSelected = end >= lParsed && end <= toParse;

        let text;
        if (startSelected || endSelected) {
          const lineStart = start - lParsed;
          const lineEnd = end - lParsed;
          const tokens = mergeUnclosedNodes(parser(lexer(line)));
          const startOverride = getStart(tokens, lineStart - 1);
          const endOverride = getEnd(tokens, lineEnd - 1);
          text = `${transpile(line.slice(0, startOverride))}${line.slice(
            startOverride,
            endOverride
          )}${transpile(line.slice(endOverride))}`;

          if (startSelected) {
            const { position, chars } = nodePosition(text, lineStart);
            selection.anchor = {
              element: `${idx}.${position < 0 ? 0 : position}`,
              offset: lineStart - chars,
            };
          }

          if (endSelected) {
            const { position, chars } = nodePosition(text, lineEnd);
            selection.focus = {
              element: `${idx}.${position < 0 ? 0 : position}`,
              offset: lineEnd - chars,
            };
          }
        } else if (lParsed > start && lParsed < end) {
          text = line;
        } else {
          text = transpile(line);
        }

        return {
          html: `${html ? html : ""}<div>${
            text ? text : ZERO_WIDTH_SPACE
          }</div>`,
          parsed: toParse,
          selection: selection,
        };
      },
      {
        html: "",
        parsed: 0,
        selection: {
          anchor: { element: "0", offset: 0 },
          focus: { element: "0", offset: 0 },
          collapsed: start === end,
        },
      }
    );
