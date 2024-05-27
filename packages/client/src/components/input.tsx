import { styled } from "@linaria/react";
import { open } from "@tauri-apps/api/dialog";
import { KeyboardEventHandler, Ref, useCallback, useState } from "react";

export type InputProps = {
  size: "small" | "medium" | "large";
  value: string;
  placeholder?: string;
  validationMessage?: string;
  message?: string;
  onChange: React.Dispatch<React.SetStateAction<string>>;
  ref?: Ref<HTMLInputElement>;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
};

export const InputInPlace = ({
  size,
  value,
  placeholder,
  onChange,
  readonly,
  onKeyDown,
}: InputProps & { readonly?: boolean }) => (
  <Input
    value={value}
    placeholder={placeholder ?? ""}
    onChange={(e: any) => onChange(e.currentTarget.value)}
    variation={size}
    readOnly={readonly ?? false}
    autoFocus={true}
    onKeyDown={onKeyDown}
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
  }, []);

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
}: InputProps) => (
  <InputWrapper>
    <InputMessage>{message}</InputMessage>
    <InputInPlace
      value={value}
      placeholder={placeholder ?? ""}
      readonly={false}
      size={size}
      onChange={onChange}
    />
    {validationMessage && <span>{validationMessage}</span>}
  </InputWrapper>
);

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2em;
  margin-top: 0;
  margin-bottom: auto;
  align-items: flex-start;
  position: relative;
`;

const InputMessage = styled.span`
  margin-left: 2em;
`;

const Input = styled.input<{ variation: InputProps["size"] }>`
  border: 1px solid grey;
  background-color: inherit;
  border-radius: 10px;

  &:focus {
    outline: none;
    border: 1px solid rgb(169, 137, 229);
  }

  &::placeholder {
    font-style: italic;
    font-size: 0.9rem;
  }

  width: ${(props) =>
    ({ small: "60%", medium: "80%", large: "90%" }[props.variation])};
  height: ${(props) =>
    ({ small: "2.4vh", medium: "2.7vh", large: "2.9vh" }[props.variation])};
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
