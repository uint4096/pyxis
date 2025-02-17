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
  validationFailed?: boolean;
};

export const InputInPlace = ({
  size,
  value,
  placeholder,
  onChange,
  readonly,
  onKeyDown,
  type,
  validationFailed,
}: InputProps & { readonly?: boolean }) => {
  console.log("Failed Validation", validationFailed);
  return (
    <Input
      value={value}
      placeholder={placeholder ?? ""}
      onChange={(e) => onChange(e.currentTarget.value)}
      variation={size}
      readOnly={readonly ?? false}
      autoFocus={true}
      onKeyDown={onKeyDown}
      type={type}
      validationFailed={validationFailed}
    />
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
  validationFailed,
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
      validationFailed={validationFailed}
    />
    {validationMessage && <span>{validationMessage}</span>}
  </InputWrapper>
);

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2em;
  position: relative;
  font-size: 1.1rem;
  width: 100%;
`;

const InputMessage = styled.span`
  margin-left: 2em;
`;

const Input = styled.input<{
  variation: InputProps["size"];
  type?: InputType;
  validationFailed?: boolean;
}>`
  border: 1px solid grey;
  background-color: inherit;
  border-radius: 10px;
  font-size: inherit;
  padding: 0 0.5vw;
  outline: none;
  border-color: ${(props) => (props.validationFailed ? "#c6011f" : "#8f94f3")};

  &:focus {
    border: 1px solid
      ${(props) => (props.validationFailed ? "#c6011f" : "#8f94f3")};
  }

  &::placeholder {
    font-style: italic;
    font-size: 1rem;
  }

  height: ${(props) =>
    ({ small: "2.7vh", medium: "2.9vh", large: "3.2vh" })[props.variation]};
  type: ${(props) => props.type ?? "text"};
`;
