import { useCallback, useState } from "react";
import "./input.css";
import { open } from "@tauri-apps/api/dialog";

export type InputProps = {
  size: "small" | "medium" | "large";
  value: string;
  placeholder?: string;
  validationMessage?: string;
  message?: string;
  onChange: React.Dispatch<React.SetStateAction<string>>;
};

export const DirSelection = ({
  size,
  value,
  placeholder,
  validationMessage,
  message,
  onChange,
}: InputProps) => {
  const [inputVal, setVal] = useState(value);
  const [validationMsg, setValidationMsg] = useState(validationMessage);

  const onOpen = useCallback(async () => {
    const selected = await open({
      directory: true,
    });

    if (!selected) {
      setValidationMsg("You must select a directory");
      return;
    }

    setVal(selected as string);
    onChange(selected as string);
  }, []);

  return (
    <div className="input-wrapper">
      <span className="input-message">{message}</span>
      <div className="input-selection">
        <input
          className={`input input-${size}`}
          value={inputVal}
          placeholder={placeholder}
          readOnly
        />
        <button className="dir-select-btn" onClick={onOpen}>
          ...
        </button>
      </div>
      {validationMessage && (
        <span className="validation-message">{validationMsg}</span>
      )}
    </div>
  );
};
