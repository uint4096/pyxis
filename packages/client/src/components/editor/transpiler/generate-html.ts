import { transpile } from "./transpile";
import { ZERO_WIDTH_SPACE } from "../../../utils";

export const getHTMLContent = (textCaret: number, rawText: string) => {
  const lines = rawText.split("\n");
  const { htmlContent, selection } = lines.reduce(
    ({ htmlContent: html, lengthParsed, selection }, line, index) => {
      // + 1 to account for the \n that gets lost in the split for lines > 0
      const parsedChars = lengthParsed + (index ? 1 : 0);
      const toParse = parsedChars + line.length;

      if (textCaret >= parsedChars && textCaret <= toParse) {
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
            element: index,
            offset: textCaret - parsedChars,
          },
        };
      } else {
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
        element: lines.length - 1,
        offset: lines[lines.length - 1].length,
      },
    }
  );

  return {
    htmlContent,
    selection,
  };
};
