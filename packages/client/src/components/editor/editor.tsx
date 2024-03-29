import { useState, useEffect, KeyboardEvent, SyntheticEvent } from "react";
import { useCallback } from "react";
import "./editor.css";
import { getCaretFromDomNodes, getSelection } from "./dom";
import { getHTMLContent, type Selection } from "./transpiler";
import { selectionKeys, Actions, type Caret } from "./keys";

const Editor = () => {
  const [rawText, setRawText] = useState<{
    text: string;
    caret: Caret;
  }>({ text: "", caret: { start: 0, end: 0, collapsed: true } });

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

  const onSelection = useCallback(
    (event: SyntheticEvent) => {
      if (
        !selectionKeys.includes(lastKey) &&
        event.nativeEvent.type !== "mouseup"
      ) {
        return;
      }

      const editor = getEditor();

      const { anchor, focus, collapsed } = getSelection(editor);

      if (anchor && focus && editor) {
        const start = getCaretFromDomNodes(editor, anchor.node, anchor.offset);

        const end = collapsed
          ? start
          : getCaretFromDomNodes(editor, focus.node, focus.offset);

        setLastKey("");
        setRawText((rawText) => ({
          ...rawText,
          caret: {
            start,
            end,
            collapsed,
          },
        }));
      }
    },
    [lastKey]
  );

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
    const { htmlContent, selection } = getHTMLContent(
      caret.start,
      caret.end,
      text
    );
    setHtml(() => ({
      content: htmlContent,
      selection,
    }));
  }, [rawText]);

  useEffect(() => {
    const { selection } = html ?? {};
    const editor = getEditor();

    const anchorNode =
      editor?.childNodes[selection?.anchor.element ?? 0]?.childNodes?.[0];
    const anchor = anchorNode ?? editor;

    const focusNode =
      editor?.childNodes[selection?.focus.element ?? 0]?.childNodes?.[0];
    const focus = focusNode ?? editor;

    const windowSelection = window.getSelection();
    const range = new Range();
    range.setStart(anchor, selection?.anchor.offset ?? 0);
    if (selection?.collapsed) {
      range.collapse();
    } else {
      range.setEnd(focus, selection?.focus.offset ?? 0);
    }
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
