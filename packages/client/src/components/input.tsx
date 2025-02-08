import { styled } from "@linaria/react";
import { open } from "@tauri-apps/plugin-dialog";
import { KeyboardEventHandler, Ref, useCallback, useState } from "react";

type InputType = "text" | "password";

export type InputProps = {
  size: "small" | "medium" | "large";
  value: string;
  placeholder?: string;
  validationMessage?: string;
  message?: string;
  onChange: React.Dispatch<React.SetStateAction<string>>;
  ref?: Ref<HTMLInputElement>;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  type?: InputType;
};

export const InputInPlace = ({
  size,
  value,
  placeholder,
  onChange,
  readonly,
  onKeyDown,
  type,
}: InputProps & { readonly?: boolean }) => (
  <Input
    value={value}
    placeholder={placeholder ?? ""}
    onChange={(e) => onChange(e.currentTarget.value)}
    variation={size}
    readOnly={readonly ?? false}
    autoFocus={true}
    onKeyDown={onKeyDown}
    type={type}
  />
);

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
  }, [onChange]);

  return (
    <InputWrapper>
      <InputMessage>{message}</InputMessage>
      <InputSelection>
        <InputInPlace
          value={inputVal}
          placeholder={placeholder ?? ""}
          readonly={true}
          size={size}
          onChange={onChange}
        />
        <DirSelectButton onClick={onOpen}>...</DirSelectButton>
      </InputSelection>
      {validationMessage && <span>{validationMsg}</span>}
    </InputWrapper>
  );
};

export const TextInput = ({
  size,
  value,
  placeholder,
  validationMessage,
  message,
  onChange,
  type,
}: InputProps) => (
  <InputWrapper>
    {message && <InputMessage>{message}</InputMessage>}
    <InputInPlace
      value={value}
      placeholder={placeholder ?? ""}
      readonly={false}
      size={size}
      onChange={onChange}
      type={type}
    />
    {validationMessage && <span>{validationMessage}</span>}
  </InputWrapper>
);

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2em;
  align-items: center;
  position: relative;
  width: 100%;
  font-size: 1.1rem;
`;

const InputMessage = styled.span`
  margin-left: 2em;
`;

const Input = styled.input<{
  variation: InputProps["size"];
  type?: InputType;
}>`
  border: 1px solid grey;
  background-color: inherit;
  border-radius: 10px;
  font-size: inherit;
  padding: 0 0.5vw;

  &:focus {
    outline: none;
    border: 1px solid rgb(169, 137, 229);
  }

  &::placeholder {
    font-style: italic;
    font-size: 1rem;
  }

  width: ${(props) =>
    ({ small: "60%", medium: "80%", large: "90%" })[props.variation]};
  height: ${(props) =>
    ({ small: "2.4vh", medium: "2.7vh", large: "2.9vh" })[props.variation]};
  type: ${(props) => props.type ?? "text"};
`;

const InputSelection = styled.div`
  display: flex;
  width: 100%;
  justify-content: center;
`;

const DirSelectButton = styled.button`
  height: 2.7vh;
  padding: 10px 10px;

  &:focus {
    outline: none;
  }
`;
