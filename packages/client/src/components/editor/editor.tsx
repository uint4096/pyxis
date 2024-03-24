import { useState, useEffect, KeyboardEvent } from "react";
import { useCallback } from "react";
import "./editor.css";
import { getCaretFromDomNodes, getSelection } from "./dom";
import { actions } from "./keys/actions";
import { getHTMLContent } from "./transpiler";

type Selection = {
  element: number;
  offset: number;
};

const Editor = () => {
  const [rawText, setRawText] = useState<{
    text: string;
    caret: number;
  }>({ text: "", caret: 0 });

  const [html, setHtml] = useState<{
    content: string;
    selection: Selection;
  }>();

  const [lastKey, setLastKey] = useState("");

  const getEditor = (): Node => {
    const editor = document.getElementById("editor");
    if (!editor) {
      throw new Error(`Editor isn't available yet!`);
    }

    return editor;
  }

  const onSelection = useCallback(() => {
    const allowedKeys = ["ArrowUp", "ArrowDown"];

    if (!allowedKeys.includes(lastKey)) {
      return;
    }

    const editor = getEditor();

    const windowSelection = getSelection(editor);

    if (windowSelection && editor) {
      const caret = getCaretFromDomNodes(
        editor,
        windowSelection.node,
        windowSelection.offset
      );

      setLastKey("");
      setRawText((rawText) => ({
        ...rawText,
        caret,
      }));
    }
  }, [lastKey]);

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

    const firstTextNode = editor?.childNodes[selection?.element ?? 0]?.childNodes?.[0];
    const node = firstTextNode ?? editor;

    const windowSelection = window.getSelection();
    const range = new Range();
    range.setStart(node, selection?.offset ?? 0);
    range.collapse();
    windowSelection?.removeAllRanges();
    windowSelection?.addRange(range);
  }, [html]);

  const selectionKeys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"]; //key-const

  const insertTextAtPosition = (
    input: string,
    text: string,
    position: number
  ) =>
    `${input.slice(0, position)}${text}${input.slice(position, input.length)}`; //util

  const getKeyContent = (
    key: KeyboardEvent<HTMLDivElement>["nativeEvent"]["key"]
  ) => {
    switch (key) {
      case "Enter": {
        return "\n";
      }
      case "Control":
      case "Shift":
      case "Alt":
      case "CapsLock":
      case "Escape": {
        return "";
      }
      default: {
        return key;
      }
    }
  }; //key

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const key = event.nativeEvent.key;

      if (selectionKeys.includes(key)) {
        setLastKey(key);
        return;
      }

      if (Object.keys(actions).includes(key)) {
        setRawText((rawText) => {
          const { text: textContent, caret } = rawText;
          const text = actions[key](textContent, caret, event.ctrlKey);
          return text;
        });
      } else {
        const content = getKeyContent(key);
        if (content) {
          setRawText((rawText) => {
            const { text, caret } = rawText;
            return {
              text: insertTextAtPosition(text, content, caret),
              caret: caret + content.length,
            };
          });
        }
      }
    },
    [rawText]
  );

  return (
    <>
      <div
        id={"editor"}
        contentEditable
        dangerouslySetInnerHTML={{
          __html: html?.content ?? "",
        }}
        onSelect={onSelection}
        onKeyDown={onKeyDown}
      />
    </>
  );
};

export default Editor;
