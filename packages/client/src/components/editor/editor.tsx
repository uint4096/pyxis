import {
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  SyntheticEvent,
  KeyboardEvent,
} from "react";
import { useCallback } from "react";
import "./editor.css";
import {
  getCaretFromDomNodes,
  getDescendant,
  getRelativeElementPosition,
} from "./dom";
import { lexer, parser, toHtml } from "./transpiler";
import { actions } from "./keys/mapping";

type Selection = {
  node: string;
  offset: number;
};

const ZERO_WIDTH_SPACE = "&#8203";
const Editor = () => {
  const [rawText, setRawText] = useState<string>("");
  const [html, setHtml] = useState<{
    content: string;
    selection: Selection;
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
            /*
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
      const eventsToSkip = ["keydown", "keyup", "selectionchange"];
      if (eventsToSkip.includes(eventType)) {
        return;
      }

      const editor = getEditor();
      const selection = getSelection();
      if (selection && editor) {
        const caretPosition = getCaretFromDomNodes(
          editor,
          selection.node,
          selection.offset
        );
        const htmlContent = getHTMLContent(caretPosition, rawText);
        setHtml({ content: htmlContent, selection });
      }
    },
    [rawText]
  );

  useEffect(() => {
    const editor = getEditor();
    const selection = getSelection();
    if (selection && editor) {
      const caretPosition = getCaretFromDomNodes(
        editor,
        selection.node,
        selection.offset
      );
      const htmlContent = getHTMLContent(caretPosition, rawText);
      setHtml({
        content: htmlContent,
        selection: { ...selection, offset: selection.offset + 1 },
      });
    }
  }, [rawText]);

  useLayoutEffect(() => {
    const base = getEditor();
    const selection = html?.selection?.node ? html.selection : getSelection();
    if (!base || !selection || !selection.node) {
      /*
       * @Todo: Position caret at the end of content.
       * Not sure if this is the best fallback. But this will have to
       * do for now.
       */
      return;
    }

    const elem = getDescendant(base, selection.node);

    if (!elem) {
      //@Todo: Position caret at the end of content.
      return;
    }

    const windowSelection = window.getSelection();
    const range = new Range();
    range.setStart(elem, selection?.offset);
    range.collapse();
    windowSelection?.removeAllRanges();
    windowSelection?.addRange(range);
  }, [html]);

  const selectionKeys = [
    "ArrowRight",
    "ArrowLeft",
    "ArrowUp",
    "ArrowDown",
    "A",
  ];

  const getKeyContent = (
    key: KeyboardEvent<HTMLDivElement>["nativeEvent"]["key"]
  ) => {
    switch (key) {
      case "Enter": {
        return "\n";
      }
      case "Control":
      case "Shift":
      case "CapsLock":
      case "Escape": {
        return "";
      }
      default: {
        return key;
      }
    }
  };
  const onKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    console.log("Keyboard event: ", event);
    const key = event.nativeEvent.key;
    const editor = getEditor();
    const selection = getSelection();

    if (!selection || !editor) {
      //@todo: Throw and handle
      return;
    }

    const caret = getCaretFromDomNodes(
      editor,
      selection.node,
      selection.offset
    );

    if (Object.keys(actions).includes(key)) {
      setRawText((rawText) => {
        const { text } = actions[key](rawText, caret, event.ctrlKey);
        return text;
      });
    } else if (key in selectionKeys && event.ctrlKey) {
    } else {
      const content = getKeyContent(key);
      if (content) {
        setRawText((rawText) => `${rawText}${content}`);
      }
    }
  }, []);

  return (
    <>
      <div
        id={"editor"}
        contentEditable
        dangerouslySetInnerHTML={{
          __html: html?.content ?? "",
        }}
        ref={divRef}
        onSelect={onSelection}
        onKeyDown={onKeyDown}
      />
    </>
  );
};

export default Editor;
