import "./input.css";

export type InputProps = {
  size: "small" | "medium" | "large";
  value: string;
  placeholder?: string;
  validationMessage?: string;
  onChange: React.Dispatch<React.SetStateAction<string>>;
};

export const Input = ({
  size,
  value,
  placeholder,
  validationMessage,
  onChange,
}: InputProps) => {
  return (
    <div className="input-wrapper">
      <input
        className={`input input-${size}`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.currentTarget.value)}
      ></input>
      {validationMessage && (
        <span className="validation-message">{validationMessage}</span>
      )}
    </div>
  );
};
