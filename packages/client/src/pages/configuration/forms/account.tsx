import { styled } from "@linaria/react";
import { useCallback, useState } from "react";

import { Modal, TextInput } from "../../../components";
import { ky, toast } from "../../../utils";

export const AccountForm = ({ onDone }: { onDone: () => void }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [type, setType] = useState("signin");

  const action = useCallback(async () => {
    const endpoint =
      type === "signin"
        ? "http://localhost:8080/signup"
        : "http://localhost:8080/signin";

    try {
      const response = await ky
        .post(endpoint, {
          json: { username, password },
        })
        .json();

      // @todo: store token in config
      // show toast message
      // have a onDone prop and use it to close the modal
    } catch (e) {
      const message = type === "signin" ? "Signin failed!" : "Signup failed";
      toast(message);
    }
  }, [type, username, password]);

  const body = (
    <InputWrapper>
      <TextInput
        value={username}
        placeholder="Username"
        size="medium"
        onChange={setUsername}
      />
      <TextInput
        value={password}
        placeholder="Password"
        size="medium"
        onChange={setPassword}
        type="password"
      />
      <span>
        or{" "}
        <SwitchTypeSpan
          onClick={() =>
            setType((type) => (type === "signin" ? "signup" : "signin"))
          }
        >
          {type === "signin" ? "sign in" : "sign up"}{" "}
        </SwitchTypeSpan>
        instead
      </span>
    </InputWrapper>
  );

  const footer = (
    <FormFooter>
      <button onClick={() => action()}>
        {type === "signin" ? "Sign In" : "Sign Up"}
      </button>
    </FormFooter>
  );

  return (
    <>
      <FormWrapper>
        <FormContainer>
          <Modal body={body} size="medium" footer={footer} onClose={onDone} />
        </FormContainer>
      </FormWrapper>
    </>
  );
};

const FormContainer = styled.div`
  width: 20vw;
  height: 10vw;
  position: fixed;
`;

const FormFooter = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1em;
`;

const SwitchTypeSpan = styled.span`
  cursor: pointer;
  color: #000fff;
`;

const FormWrapper = styled.div`
  width: 90%;
  height: 80%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  flex-direction: column;
`;
