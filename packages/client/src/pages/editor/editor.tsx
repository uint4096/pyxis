import {
  useState,
  useRef,
  useEffect,
  KeyboardEvent,
  SyntheticEvent,
  useCallback,
  ClipboardEventHandler,
  useMemo,
} from "react";
import { getCaretFromDomNodes, getDescendant, getSelection } from "./dom";
import { getHTMLContent, type Selection } from "./text";
import {
  selectionKeys,
  Actions,
  type Caret,
  ctrlSelectionKeys,
  ctrlSkipKeys,
  skipKeys,
  skipKeysOnSelection,
  stopPropagationKeys,
} from "./keys";
import {
  ZERO_WIDTH_SPACE_UNICODE,
  insertTextAtPosition,
  textLength,
} from "../../utils";
import { useDebounce } from "../../hooks";
import { LoroDoc, LoroList, LoroText, VersionVector } from "loro-crdt";
import fastDiff from "fast-diff";
import { FormattedContent } from "../../store";
import { styled } from "@linaria/react";

type EditorText = {
  text: string | undefined;
  caret: Caret;
};

type EditorProps = {
  fileUid: string;
  content: FormattedContent;
  snapshotWriter: (fileUid: string, content: Uint8Array) => Promise<void>;
  updatesWriter: (
    fileUid: string,
    snapshotId: number,
    content: Uint8Array,
  ) => Promise<void>;
};

const CONTAINER_ID = "pyxis_doc";

const Editor = ({
  fileUid,
  content,
  updatesWriter,
  snapshotWriter,
}: EditorProps) => {
  const [rawText, setRawText] = useState<EditorText>({
    text: undefined,
    caret: { start: 0, end: 0, collapsed: true },
  });

  const [snapshotId, setSnapshotId] = useState<number>(content.snapshotId ?? 0);
  const [version, setVersion] = useState<VersionVector>();

  const getEditor = (): HTMLElement | null => {
    const editor = document.getElementById("editor");

    return editor;
  };

  const formatCaret = useCallback((loroList: LoroList, caret: Caret) => {
    loroList.insert(0, caret.start);
    loroList.insert(1, caret.end);
    loroList.insert(2, caret.collapsed);
  }, []);

  const extractCaret = useCallback((loroList: LoroList): Caret => {
    return {
      start: (loroList.get(0) ?? 0) as number,
      end: (loroList.get(1) ?? 0) as number,
      collapsed: (loroList.get(2) ?? true) as boolean,
    };
  }, []);

  const caretRef = useRef<Caret>();

  const {
    doc,
    loroText,
    loroCaret,
  }: { doc: LoroDoc; loroText: LoroText; loroCaret: LoroList } = useMemo(() => {
    const doc = new LoroDoc();

    if (content?.fileContent?.length) {
      doc.importBatch(content.fileContent);
    }

    setVersion(doc.version());
    const loroCaret = doc.getList(`${CONTAINER_ID}_caret`);
    const loroText = doc.getText(`${CONTAINER_ID}_text`);

    const currentCaret = extractCaret(loroCaret);
    formatCaret(loroCaret, currentCaret);

    setRawText(() => ({
      text: loroText?.toString() ?? "",
      caret: {
        start: currentCaret?.start ?? 0,
        end: currentCaret?.end ?? 0,
        collapsed: currentCaret?.collapsed ?? true,
      },
    }));

    doc.subscribe((e) => {
      if (e.by !== "local") {
        return;
      }

      const caret = extractCaret(loroCaret);
      caretRef.current = caret;
      setRawText(() => ({
        text: loroText?.toString() ?? "",
        caret: {
          start: caret?.start ?? 0,
          end: caret?.end ?? 0,
          collapsed: caret?.collapsed ?? true,
        },
      }));
    });
    return { doc, loroCaret, loroText };
  }, [content, extractCaret, formatCaret]);

  const debouncedText = useDebounce(rawText.text, 0.5);
  const textRef = useRef(debouncedText);

  const renderControl = useRef({ text: false, html: false });

  const [html, setHtml] = useState<{
    content: string;
    selection: Selection;
  }>();

  const [lastKey, setLastKey] = useState({ key: "", ctrl: false });

  const applyTextEvents = useCallback(
    (loroText: LoroText, currentText: string, updatedText: string) => {
      const diff = fastDiff(currentText, updatedText);

      let positionCounter = 0;
      diff.forEach(([op, text]) => {
        switch (op) {
          case fastDiff.INSERT: {
            loroText?.insert(positionCounter, text);
            positionCounter += text.length;
            break;
          }
          case fastDiff.DELETE: {
            loroText?.delete(positionCounter, text.length);
            break;
          }
          case fastDiff.EQUAL: {
            positionCounter += text.length;
            break;
          }
          default: {
            throw new Error("Unsupported Diff Operation!");
          }
        }
      });
    },
    [],
  );

  const onPaste: ClipboardEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      if (!loroText || !loroCaret) {
        return;
      }

      const currentText = loroText.toString();
      const currentCaret = extractCaret(loroCaret);

      const clipboardContent = event.clipboardData.getData("text");

      const text = insertTextAtPosition(
        currentText,
        event.clipboardData
          .getData("text")
          ?.replace(new RegExp(ZERO_WIDTH_SPACE_UNICODE, "g"), ""),
        currentCaret.start,
        currentCaret.end,
      );

      const caret = {
        start: currentCaret.start + textLength(clipboardContent),
        end: currentCaret.start + textLength(clipboardContent),
        collapsed: true,
      };

      applyTextEvents(loroText, currentText, text);
      formatCaret(loroCaret, caret);
      doc.commit();
    },
    [applyTextEvents, doc, extractCaret, formatCaret, loroCaret, loroText],
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

      if (!editor) {
        return;
      }

      const { anchor, focus, collapsed } = getSelection(editor);

      if (anchor && focus && editor) {
        const start = getCaretFromDomNodes(editor, anchor.node, anchor.offset);

        const end = collapsed
          ? start
          : getCaretFromDomNodes(editor, focus.node, focus.offset);

        setLastKey({ key: "", ctrl: false });

        if (!loroCaret) {
          return;
        }

        formatCaret(loroCaret, {
          start: start > end ? end : start,
          end: start > end ? start : end,
          collapsed,
        });

        doc.commit();
      }
    },
    [
      doc,
      formatCaret,
      lastKey.ctrl,
      lastKey.key,
      loroCaret,
      rawText.caret.collapsed,
    ],
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

      if (
        (!rawText.caret.collapsed && skipKeysOnSelection.includes(key)) ||
        skipKeys.includes(key)
      ) {
        return;
      }

      if (stopPropagationKeys.includes(key)) {
        event.stopPropagation();
        event.preventDefault();
      }

      if (!loroText || !loroCaret) {
        return;
      }

      const currentText = loroText.toString();
      const currentCaret = extractCaret(loroCaret);

      const { text, caret } = Actions[key](
        currentText ?? "",
        currentCaret,
        event.ctrlKey,
      );

      applyTextEvents(loroText, currentText, text);
      formatCaret(loroCaret, caret);
      doc.commit();
    },
    [
      applyTextEvents,
      doc,
      extractCaret,
      formatCaret,
      loroCaret,
      loroText,
      rawText.caret.collapsed,
    ],
  );

  const writeSnapshots = useCallback(async () => {
    await snapshotWriter(fileUid, doc.export({ mode: "snapshot" }));
    setSnapshotId((snapshotId) => snapshotId + 1);
  }, [doc, fileUid, snapshotWriter]);

  useEffect(() => {
    (async () => await writeSnapshots())();

    const interval = setInterval(
      async () => await writeSnapshots(),
      15 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [doc, snapshotWriter, version, writeSnapshots]);

  useEffect(() => {
    if (!fileUid || textRef.current === debouncedText) {
      return;
    }

    textRef.current = debouncedText;

    (async () =>
      await updatesWriter(
        fileUid!,
        snapshotId,
        doc.export({ mode: "update", from: version }),
      ))();
  }, [debouncedText, doc, fileUid, snapshotId, updatesWriter, version]);

  useEffect(() => {
    if (!renderControl.current.html) {
      renderControl.current.html = true;
      return;
    }
    const { caret, text } = rawText;
    const { html: htmlContent, selection } = getHTMLContent(
      caret.start,
      caret.end,
      text ?? "",
    );
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
      {rawText.text != null && (
        <TextEditor
          id={"editor"}
          contentEditable
          dangerouslySetInnerHTML={{
            __html: html?.content ?? "",
          }}
          onSelect={onSelection}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
        />
      )}
    </>
  );
};

const TextEditor = styled.div`
  flex-grow: 1;
  padding: 4vh 20vw;
  white-space: pre-wrap;
  font-family: "Lato";
  text-align: left;
  font-size: 1.2em;
  overflow: auto;
  width: 80vw;

  &:focus {
    outline: none;
  }

  &:after {
    content: "";
    height: 40vh;
    display: inline-block;
  }

  & code {
    color: #ea928a;
    background-color: #a1a19f3d;
    padding: 0 5px;
    border-radius: 3px;
  }

  & h1 {
    font-size: 1em;
    line-height: 1.1;
    margin-left: 0;
  }

  & h2 {
    font-size: 2.7em;
    line-height: 0.9;
    margin-left: 0;
  }

  & h3 {
    font-size: 2em;
    line-height: 0.7;
    margin-left: 0;
  }

  & h4 {
    font-size: 1.8em;
    line-height: 0.5;
    margin-left: 0;
  }

  & h5 {
    font-size: 1.4em;
    line-height: 0.3;
    margin-left: 0;
  }

  & h6 {
    font-size: 1.2em;
    line-height: 0.1;
    margin-left: 0;
  }
`;

export default Editor;
