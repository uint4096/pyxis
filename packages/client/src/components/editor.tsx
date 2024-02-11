import MarkdownIt from "markdown-it";
import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useLayoutEffect } from "react";
import "./editor.css";

const Editor = () => {
  const [value, setValue] = useState("");
  const [content, setContent] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const val = event.currentTarget.value;
    setValue(val);
  };

  useEffect(() => {
    const md = MarkdownIt({ breaks: true });
    const c = md.render(value);
    setContent(c);
  }, [value]);

  useLayoutEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.selectionStart = textAreaRef.current.selectionEnd =
        value.length;
      textAreaRef.current.focus();
    }
  });

  // useLayoutEffect(() => {
  //   if (caret.node) {
  //     // const element = document.getElementById('editor');
  //     // const range = new Range();
  //     // range.setStart(element.firstChild, 1);
  //     // range.setEnd(caret.node, caret.offset);
  //     // document.getSelection().removeAllRanges();
  //     // document.getSelection().addRange(range);
  //     // range.collapse();
  //     // element.focus();
  //   }
  // }, [caret]);

  // useLayoutEffect(() => {
  //   document.onselectionchange = function() {
  //     let selection = document.getSelection();

  //     let {anchorNode, anchorOffset, focusNode, focusOffset} = selection;

  //     // anchorNode and focusNode are text nodes usually
  //     from.value = `${anchorNode?.data}, offset ${anchorOffset}`;
  //     to.value = `${focusNode?.data}, offset ${focusOffset}`;
  //   };
  // }, [])

  return (
    <>
      <div id={"editor"} dangerouslySetInnerHTML={{ __html: content }} />
      <textarea
        className="hiddenEditor"
        ref={textAreaRef}
        onChange={handleInput}
      >
        {value}
      </textarea>
    </>
  );
};

export default Editor;
