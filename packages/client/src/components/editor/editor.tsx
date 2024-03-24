import { useState, useEffect, KeyboardEvent } from "react";
import { useCallback } from "react";
import "./editor.css";
import { getCaretFromDomNodes, getSelection } from "./dom";
import { Actions } from "./keys/actions";
import { getHTMLContent } from "./transpiler";
import { selectionKeys } from "./keys";

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
  };

  const onSelection = useCallback(() => {
    if (!selectionKeys.includes(lastKey)) {
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

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const key = event.nativeEvent.key;

      if (selectionKeys.includes(key)) {
        setLastKey(key);
        return;
      }

      setRawText((rawText) => {
        const { text: textContent, caret } = rawText;
        const text = Actions[key](textContent, caret, event.ctrlKey);
        return text;
      });
    },
    [rawText]
  );

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

    const firstTextNode =
      editor?.childNodes[selection?.element ?? 0]?.childNodes?.[0];
    const node = firstTextNode ?? editor;

    const windowSelection = window.getSelection();
    const range = new Range();
    range.setStart(node, selection?.offset ?? 0);
    range.collapse();
    windowSelection?.removeAllRanges();
    windowSelection?.addRange(range);
  }, [html]);

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
