import { transpile } from "./transpile";
import { ZERO_WIDTH_SPACE } from "../../../utils";

type SelectedElement = {
  element: number;
  offset: number;
};

export type Selection = {
  anchor: SelectedElement;
  focus: SelectedElement;
  collapsed: boolean;
};

type Content = {
  htmlContent: string;
  selection: Selection;
};

export const getHTMLContent = (
  start: number,
  end: number,
  rawText: string
): Content => {
  const lines = rawText.split("\n");
  const { htmlContent, selection } = lines.reduce(
    ({ htmlContent: html, lengthParsed, selection }, line, index) => {
      // + 1 to account for the \n that gets lost in the split for lines > 0
      const parsedChars = lengthParsed + (index ? 1 : 0);
      const toParse = parsedChars + line.length;

      const startSelected = start >= parsedChars && start <= toParse;
      const endSelected = end >= parsedChars && end <= toParse;

      if (startSelected || endSelected) {
        // Process currently selected line(s)
        return {
          /*
           * Chrome folds a div that has no content. Hence the use of a zero-width space
           * https://www.fileformat.info/info/unicode/char/200b/index.htm
           */
          htmlContent: `${html ? html : ""}<div>${
            line ? line : ZERO_WIDTH_SPACE
          }</div>`,
          lengthParsed: toParse,
          selection: {
            anchor: startSelected
              ? {
                  element: index,
                  offset: start - parsedChars,
                }
              : { ...selection.anchor },
            focus: endSelected
              ? {
                  element: index,
                  offset: end - parsedChars,
                }
              : { ...selection.focus },
            collapsed: start === end,
          },
        };
      } else {
        // Process all other lines
        const content = transpile(line);
        return {
          selection,
          htmlContent: `${html}<div>${
            content ? content : ZERO_WIDTH_SPACE
          }</div>`,
          lengthParsed: toParse,
        };
      }
    },
    {
      htmlContent: "",
      lengthParsed: 0,
      selection: {
        anchor: {
          element: lines.length - 1,
          offset: lines[lines.length - 1].length,
        },
        focus: {
          element: lines.length - 1,
          offset: lines[lines.length - 1].length,
        },
        collapsed: true,
      },
    }
  );

  return {
    htmlContent,
    selection,
  };
};
