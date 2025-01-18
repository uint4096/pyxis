import { styled } from "@linaria/react";
import { useCallback, useState } from "react";

import { Modal, TextInput } from "../../../components";
import { toast } from "../../../utils";
import { useConfig } from "../../../store";
import { HTTPError } from "ky";
import { useAuthRequests } from "../../../hooks";

export const AccountForm = ({ onDone }: { onDone: () => void }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { create, config } = useConfig();
  const { registerOrLogin } = useAuthRequests();

  const [type, setType] = useState<"signin" | "signup">("signin");

  const action = useCallback(async () => {
    try {
      const { response, status } = await registerOrLogin(type, {
        username,
        password,
        device_id: config.deviceId,
      });

      if (status === "offline") {
        toast(
          "You seem to be offline. Registration or login requires network connection!",
        );
      }

      const { user_id, device_id, user_token: token } = response ?? {};
      await create(username, user_id!, token!, device_id!);
      onDone();
    } catch (e) {
      if (e instanceof HTTPError && /Username taken/g.test(e.message)) {
        toast(e.message);
        return;
      }

      const message = type === "signin" ? "Signin failed!" : "Signup failed!";
      toast(message);
    }
  }, [
    registerOrLogin,
    type,
    username,
    password,
    config.deviceId,
    create,
    onDone,
  ]);

  const body = (
    <FormWrapper>
      <FormContainer>
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
        </InputWrapper>
      </FormContainer>
      <LoginButton onClick={action}>
        {type === "signin" ? "Sign In" : "Sign Up"}
      </LoginButton>
      <span>
        or{" "}
        <SwitchTypeSpan
          onClick={() =>
            setType((type) => (type === "signin" ? "signup" : "signin"))
          }
        >
          {type === "signin" ? "sign up" : "sign in"}{" "}
        </SwitchTypeSpan>
        instead
      </span>
    </FormWrapper>
  );

  return (
    <>
      <Modal body={body} size="medium" onClose={onDone} />
    </>
  );
};

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  width: 100%;
  justify-content: center;
`;

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1em;
`;

const SwitchTypeSpan = styled.span`
  cursor: pointer;
  color: #96a4e5;
`;

const FormWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 2em;
`;

const LoginButton = styled.button`
  background-color: #96a4e5;
  width: 80%;
  align-self: flex-start;
`;
