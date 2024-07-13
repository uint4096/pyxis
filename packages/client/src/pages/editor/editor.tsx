import "./editor.css";
import {
  useState,
  useRef,
  useEffect,
  KeyboardEvent,
  SyntheticEvent,
  useCallback,
  ClipboardEventHandler,
} from "react";
import { getCaretFromDomNodes, getDescendant, getSelection } from "./dom";
import { getHTMLContent, type Selection } from "./text";
import {
  selectionKeys,
  Actions,
  type Caret,
  ctrlSelectionKeys,
  ctrlSkipKeys,
} from "./keys";
import {
  ZERO_WIDTH_SPACE_UNICODE,
  insertTextAtPosition,
  textLength,
} from "../../utils";
import { File, FileWithContent } from "../../types";
import { useDebounce } from "../../hooks";

type EditorText = {
  text: string;
  caret: Caret;
};

type EditorProps = {
  fileWithContent: Partial<FileWithContent>;
  writer: (content: string) => Promise<void>;
};

const Editor = ({ fileWithContent, writer }: EditorProps) => {
  const [rawText, setRawText] = useState<EditorText>({
    text: fileWithContent?.content ?? "",
    caret: { start: 0, end: 0, collapsed: true },
  });

  const debouncedText = useDebounce(rawText.text, 0.5);

  const renderControl = useRef({ text: false, html: false });

  const [html, setHtml] = useState<{
    content: string;
    selection: Selection;
  }>();

  const [lastKey, setLastKey] = useState({ key: "", ctrl: false });

  const getEditor = (): Node => {
    const editor = document.getElementById("editor");
    if (!editor) {
      throw new Error(`Editor isn't available yet!`);
    }

    return editor;
  };

  const onPaste: ClipboardEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      setRawText(({ text, caret }) => {
        const content = event.clipboardData.getData("text");
        return {
          text: insertTextAtPosition(
            text,
            content.replace(new RegExp(ZERO_WIDTH_SPACE_UNICODE, "g"), ""),
            caret.start,
            caret.end,
          ),
          caret: {
            start: caret.start + textLength(content),
            end: caret.start + textLength(content),
            collapsed: true,
          },
        };
      });
    },
    [],
  );

  const onSelection = useCallback(
    (event: SyntheticEvent) => {
      if (
        !selectionKeys.includes(lastKey.key) &&
        event.nativeEvent.type !== "mouseup" &&
        (event.nativeEvent.type !== "selectionchange" ||
          rawText.caret.collapsed) &&
        (!ctrlSelectionKeys.includes(lastKey.key) || !lastKey.ctrl)
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

        setLastKey({ key: "", ctrl: false });
        setRawText((rawText) => ({
          ...rawText,
          caret: {
            start: start > end ? end : start,
            end: start > end ? start : end,
            collapsed,
          },
        }));
      }
    },
    [lastKey, rawText.caret.collapsed],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const key = event.nativeEvent.key;

      if (
        selectionKeys.includes(key) ||
        (event.ctrlKey && ctrlSelectionKeys.includes(key)) ||
        (event.ctrlKey && !rawText.caret.collapsed)
      ) {
        setLastKey({ key, ctrl: event.ctrlKey });
        return;
      } else if (event.ctrlKey && ctrlSkipKeys.includes(key)) {
        return;
      }

      setRawText((rawText) => {
        const { text: textContent, caret } = rawText;
        const text = Actions[key](textContent, caret, event.ctrlKey);
        return text;
      });
    },
    [rawText],
  );

  useEffect(() => {
    const content = fileWithContent?.content;
    if (content == null || !renderControl.current.text) {
      renderControl.current.text = true;
      return;
    }

    setRawText(() => ({
      text: content,
      caret: {
        start: content.length,
        end: content.length,
        collapsed: true,
      },
    }));
  }, [fileWithContent?.content]);

  useEffect(() => {
    if (!renderControl.current.html) {
      renderControl.current.html = true;
      return;
    }
    const { caret, text } = rawText;
    const { html: content, selection } = getHTMLContent(
      caret.start,
      caret.end,
      text,
    );
    setHtml(() => ({
      content,
      selection,
    }));
  }, [fileWithContent, rawText, writer]);

  useEffect(() => {
    if (!fileWithContent.name) {
      return;
    }

    (async () => await writer(debouncedText ?? ""))();
  }, [fileWithContent, debouncedText, writer]);

  useEffect(() => {
    const { selection } = html ?? {};
    const editor = getEditor();

    const anchorNode = getDescendant(editor, selection?.anchor.element ?? "0");
    const anchor = anchorNode ?? editor;

    const focusNode = getDescendant(editor, selection?.focus.element ?? "0");
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
        onPaste={onPaste}
      />
    </>
  );
};

export default Editor;
