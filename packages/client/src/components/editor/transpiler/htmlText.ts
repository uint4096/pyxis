import { toHtml } from "./html-generator.js";
import { lexer } from "./lexer.js";
import { parser } from "./parser.js";

const transpile = (text: string) => toHtml(parser(lexer(text)));

const getHTMLContent = (caretPosition: number, rawText: string) => {
  const lines = rawText.split("\n");
  const { html } = lines.reduce(
    ({ html, lengthParsed }, line, index) => {
      // + 1 to account for the \n that gets lost in the split for lines > 0
      const parsedSize = lengthParsed + line.length + (index ? 1 : 0);

      if (caretPosition >= lengthParsed && caretPosition <= parsedSize) {
        return {
          html: `${html ? `${html}\n` : ""}${line}`,
          lengthParsed: parsedSize,
        };
      } else {
        return {
          html: `${html}${transpile(line)}\n`,
          lengthParsed: parsedSize,
        };
      }
    },
    { html: "", lengthParsed: 0 }
  );

  return html;
};

(() => {
  const caretPosition = 68;
  const rawText =
    "My name is ***Abhishek Kumar*** and I am a ***Full-~~stack~~ dev***\n";
  const html = getHTMLContent(caretPosition, rawText);
  console.log(html);
})();
