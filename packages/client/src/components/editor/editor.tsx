import {
  useState,
  useRef,
  ChangeEvent,
  useLayoutEffect,
  useEffect,
  SyntheticEvent,
} from "react";
import { useCallback } from "react";
import "./editor.css";
import {
  getCaretPosition,
  getDescendant,
  getRelativeElementPosition,
} from "./dom";
import { lexer, parser, toHtml, toText } from "./transpiler";

const ZERO_WIDTH_SPACE = "&#8203";
const Editor = () => {
  const [rawText, setRawText] = useState<string>('');
  const [html, setHtml] = useState<{
    content: string;
    caretPosition: number;
  }>();
  const [currentSelection, setCurrentSelection] = useState<{
    node: string;
    offset: number;
  }>();

  const divRef = useRef<HTMLDivElement>(null);

  const transpile = (text: string) => toHtml(parser(lexer(text)));

  const getHTMLContent = (caretPosition: number, rawText: string) => {
    const lines = rawText.split("\n");
    const { htmlContent } = lines.reduce(
      ({ htmlContent: html, lengthParsed }, line, index) => {
        // + 1 to account for the \n that gets lost in the split for lines > 0
        const parsedSize = lengthParsed + line.length + (index ? 1 : 0);

        if (caretPosition >= lengthParsed && caretPosition <= parsedSize) {
          return {
            /**
             * Chrome folds a div that has no content. Hence the use of a zero-width space
             * https://www.fileformat.info/info/unicode/char/200b/index.htm
             */
            htmlContent: `${html ? html : ""}<div>${
              line ? line : ZERO_WIDTH_SPACE
            }</div>`,
            lengthParsed: parsedSize,
          };
        } else {
          return {
            htmlContent: `${html}<div>${transpile(line)}</div>`,
            lengthParsed: parsedSize,
          };
        }
      },
      { htmlContent: "", lengthParsed: 0 }
    );

    return htmlContent;
  };

  const getEditor = () => document.getElementById("editor");

  const getSelection = () => {
    const selection = window.getSelection();
    const editor = getEditor();
    if (selection && selection.isCollapsed && selection.anchorNode && editor) {
      const position = getRelativeElementPosition(
        editor,
        selection?.anchorNode
      );

      return { node: position, offset: selection.anchorOffset };
    }
  };

  const onSelection = useCallback(
    (event: SyntheticEvent<HTMLDivElement, Event>) => {
      const eventType = event.nativeEvent.type;
      if (eventType === "keydown" || eventType === "selectionchange") {
        return;
      }

      const editor = getEditor();
      const selection = getSelection();
      if (selection && editor) {
        setCurrentSelection(selection);

        const caretPosition = getCaretPosition(
          editor,
          selection.node,
          selection.offset
        );
        const htmlContent = getHTMLContent(caretPosition, rawText);
        setHtml({ content: htmlContent, caretPosition });
      }
    },
    [rawText]
  );

  const onInput = useCallback((event: ChangeEvent<HTMLDivElement>) => {
    const textContent = toText(
      event.target.innerHTML
        .replace(/\<br\>/g, "")
        .replace(new RegExp(ZERO_WIDTH_SPACE, "g"), "")
    );
    const selection = getSelection();
    if (selection) {
      setCurrentSelection(selection);
    }

    setRawText(textContent);
  }, []);

  useEffect(() => {
    const editor = getEditor();
    const selection = currentSelection ?? getSelection();
    if (selection && editor) {
      const caretPosition = getCaretPosition(
        editor,
        selection.node,
        selection.offset
      );
      const htmlContent = getHTMLContent(caretPosition, rawText);
      setHtml({ content: htmlContent, caretPosition });
    }
  }, [rawText]);

  useLayoutEffect(() => {
    const base = getEditor();
    const selection = currentSelection ?? getSelection();
    if (selection && base && selection.node) {
      const elem = getDescendant(base, selection.node);
      const windowSelection = window.getSelection();
      const range = new Range();
      range.setStart(elem, selection?.offset);
      range.collapse();
      windowSelection?.removeAllRanges();
      console.log("Updating cursor", `${selection.offset}`);
      windowSelection?.addRange(range);
    }
  }, [html]);

  return (
    <>
      <div
        id={"editor"}
        contentEditable
        dangerouslySetInnerHTML={{
          __html: html?.content ?? "",
        }}
        onInput={onInput}
        ref={divRef}
        onSelect={onSelection}
      />
    </>
  );
};

export default Editor;
