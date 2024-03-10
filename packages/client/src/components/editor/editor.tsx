import { useState, useRef, ChangeEvent, useLayoutEffect } from "react";
import { useCallback } from "react";
import "./editor.css";
import { getDescendant, getRelativeElementPosition } from "./dom";

const Editor = () => {
  const [rawText, setRawText] = useState<string>("");
  const [html, setHtml] = useState<string>("");
  const [currentSelection, setCurrentSelection] = useState<{
    node: string;
    offset: number;
  }>();

  const divRef = useRef<HTMLDivElement>(null);

  const onInput = useCallback((event: ChangeEvent<HTMLDivElement>) => {
    const editor = document.getElementById("editor");
    const selection = window.getSelection();
    if (selection && selection.isCollapsed && selection.anchorNode && editor) {
      const position = getRelativeElementPosition(
        editor,
        selection?.anchorNode
      );
      setCurrentSelection({ node: position, offset: selection.anchorOffset });
    }
    setRawText(`${event.currentTarget.innerHTML}`);
  }, []);

  useLayoutEffect(() => {
    const base = document.getElementById("editor");
    if (currentSelection && currentSelection.node && base) {
      const elem = getDescendant(base, currentSelection.node);
      const selection = window.getSelection();
      const range = new Range();
      range.setStart(elem, currentSelection?.offset);
      range.collapse();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [rawText]);

  return (
    <>
      <div
        id={"editor"}
        contentEditable
        dangerouslySetInnerHTML={{
          __html: rawText,
        }}
        onInput={onInput}
        ref={divRef}
      />
    </>
  );
};

export default Editor;
