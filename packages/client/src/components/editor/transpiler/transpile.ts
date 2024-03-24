import { lexer } from "./lexer";
import { parser } from "./parser";
import { toHtml } from "./to-html";

export const transpile = (text: string) => toHtml(parser(lexer(text)));
