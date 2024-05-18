import { compose } from "../../../../utils";
import { lexer } from "./lexer";
import { parser } from "./parser";
import { toHtml } from "./to-html";

export const transpile = (text: string) => compose(toHtml, parser, lexer)(text);
