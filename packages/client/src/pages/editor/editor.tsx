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
import { useDebounce } from "../../hooks";
import { Loro } from "loro-crdt";
import { getStepsForTransformation } from "string-differ";

type EditorText = {
  text: string;
  caret: Caret;
};

type EditorProps = {
  fileId: number;
  content: Uint8Array | undefined;
  writer: (fileId: number, content: Uint8Array) => Promise<void>;
};

const CONTAINER_ID = "pyxis_doc";

const Editor = ({ fileId, content, writer }: EditorProps) => {
  const [rawText, setRawText] = useState<EditorText>(() => {
    const doc = new Loro();
    if (content?.length) {
      doc.import(content);
    }

    const loroText = doc.getText(CONTAINER_ID)?.toString();

    return {
      text: loroText ?? "",
      caret: { start: loroText.length, end: loroText.length, collapsed: true },
    };
  });

  const debouncedText = useDebounce(rawText.text, 0.5);

  const textRef = useRef(debouncedText);

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

  const textToBlob = useCallback(() => {
    const doc = new Loro();

    if (content?.length) {
      doc.import(content);
    }

    const loroText = doc.getText(CONTAINER_ID);

    const diff = getStepsForTransformation("Range", {
      s1: loroText.toString() ?? "",
      s2: debouncedText ?? "",
    });

    let positionCounter = 0;
    diff.forEach((step) => {
      switch (step.type) {
        case "insert": {
          loroText?.insert(positionCounter, step.value);
          positionCounter += 1;
          break;
        }
        case "delete": {
          const length = step.endIndex - step.startIndex + 1;
          loroText?.delete(positionCounter, length);
          positionCounter += length;
          break;
        }
        case "retain": {
          const length = step.endIndex - step.startIndex + 1;
          positionCounter += length;
          break;
        }
        default: {
          throw new Error("Unsupported Diff Operation!");
        }
      }
    });

    return {
      updates: doc.exportFrom(),
      snapshot: doc.exportSnapshot(),
    };
  }, [content, debouncedText]);

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
        const textAndCaret = Actions[key](textContent, caret, event.ctrlKey);
        return textAndCaret;
      });
    },
    [rawText],
  );

  useEffect(() => {
    if (!fileId || textRef.current === debouncedText) {
      return;
    }

    textRef.current = debouncedText;

    const blob = textToBlob();

    (async () => await writer(fileId!, blob.snapshot))();
  }, [debouncedText, fileId, textToBlob, writer]);

  useEffect(() => {
    if (!renderControl.current.html) {
      renderControl.current.html = true;
      return;
    }
    const { caret, text } = rawText;
    const { html: htmlContent, selection } = getHTMLContent(
      caret.start,
      caret.end,
      text,
    );
    setHtml(() => ({
      content: htmlContent,
      selection,
    }));
  }, [rawText]);

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
