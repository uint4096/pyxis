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
  element: number;
  offset: number;
};

const ZERO_WIDTH_SPACE = "&#8203";
const Editor = () => {
  const [rawText, setRawText] = useState<{
    text: string;
    caret: number;
  }>({ text: "", caret: 0 });

  const [html, setHtml] = useState<{
    content: string;
    selection: Selection;
  }>();

  const divRef = useRef<HTMLDivElement>(null);

  const transpile = (text: string) => toHtml(parser(lexer(text)));

  const getHTMLContent = (textCaret: number, rawText: string) => {
    const lines = rawText.split("\n");
    const { htmlContent, selection } = lines.reduce(
      ({ htmlContent: html, lengthParsed, selection }, line, index) => {
        // + 1 to account for the \n that gets lost in the split for lines > 0
        const parsedChars = lengthParsed + (index ? 1 : 0);
        const toParse = parsedChars + line.length;

        if (textCaret >= lengthParsed && textCaret <= toParse) {
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
              offset: textCaret - parsedChars
            }
          };
        } else {
          return {
            selection,
            htmlContent: `${html}<div>${transpile(line)}</div>`,
            lengthParsed: toParse,
          };
        }
      },
      { htmlContent: "", lengthParsed: 0, selection: { element: lines.length - 1, offset: lines[lines.length - 1].length } }
    );

    return {
      htmlContent,
      selection
    };
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

  // const onSelection = useCallback(
  //   (event: SyntheticEvent<HTMLDivElement, Event>) => {
  //     const eventType = event.nativeEvent.type;
  //     const eventsToSkip = ["keydown", "keyup", "selectionchange"];
  //     if (eventsToSkip.includes(eventType)) {
  //       return;
  //     }

  //     const { htmlContent, selection } = getHTMLContent(caretPosition, rawText);
  //     setHtml({ content: htmlContent, selection });

  //     // const editor = getEditor();
  //     // const selection = getSelection();
  //     // if (selection && editor) {
  //     //   const caretPosition = getCaretFromDomNodes(
  //     //     editor,
  //     //     selection.node,
  //     //     selection.offset
  //     //   );
  //     //   const { htmlContent, selection } = getHTMLContent(caretPosition, rawText);
  //     //   setHtml({ content: htmlContent, selection });
  //     // }
  //   },
  //   [rawText]
  // );

  useEffect(() => {
    const { caret, text } = rawText;
    const { htmlContent, selection } = getHTMLContent(caret, text);
    setHtml(() => ({
      content: htmlContent,
      selection,
    }));
  }, [rawText]);

  useEffect(() => {
    const { selection } = html ?? {};
    const editor = getEditor();

    if (!editor) {
      return;
    }

    const node = editor?.childNodes[selection?.element ?? 0]?.childNodes?.[0] ?? editor
    // const selection = html?.selection?.node ? html.selection : getSelection();

    const windowSelection = window.getSelection();
    const range = new Range();
    range.setStart(node, selection?.offset ?? 0);
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

    if (Object.keys(actions).includes(key)) {
      setRawText((rawText) => {
        const { text: textContent, caret } = rawText;
        const text = actions[key](textContent, caret, event.ctrlKey);
        return text;
      });
    } else if (key in selectionKeys && event.ctrlKey) {
    } else {
      const content = getKeyContent(key);
      if (content) {
        setRawText((rawText) => ({
          text: `${rawText.text}${content}`,
          caret: rawText.caret + 1
        }));
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
        // onSelect={onSelection}
        onKeyDown={onKeyDown}
      />
    </>
  );
};

export default Editor;
