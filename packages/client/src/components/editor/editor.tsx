import React, { useState, useRef, ChangeEvent } from "react";
import { useCallback } from "react";

const Editor = () => {
  const [rawText, setRawText] = useState<string>("");
  const [html, setHtml] = useState<string>("");

  const divRef = useRef(null);

  const onInput = useCallback((event: ChangeEvent<HTMLDivElement>) => {
    //
  }, []);

  return (
    <>
      <div
        id={"editor"}
        contentEditable
        dangerouslySetInnerHTML={{ __html: html }}
        onInput={onInput}
        ref={divRef}
      />
    </>
  );
};

export default Editor;
