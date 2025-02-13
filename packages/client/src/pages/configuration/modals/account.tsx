import { styled } from "@linaria/react";
import { useCallback, useState } from "react";

import { TextInput, Modal } from "../../../components";
import { toast, HTTPError } from "../../../utils";
import { useConfig } from "../../../store";
import { useAuthRequests } from "../../../hooks";

export const AccountForm = ({ onDone }: { onDone: () => void }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { create, getDeviceId } = useConfig();
  const { registerOrLogin } = useAuthRequests();

  const [type, setType] = useState<"signin" | "signup">("signin");

  const action = useCallback(async () => {
    try {
      const { response, status } = await registerOrLogin(type, {
        username,
        password,
        device_id: await getDeviceId(),
      });

      if (status === "offline") {
        toast(
          "We can't reach our servers. Registration or login requires network connection!",
        );
      } else {
        const { user_id, device_id, user_token: token } = response ?? {};
        await create(username, user_id!, token!, device_id!);
        onDone();
      }
    } catch (e) {
      if (e instanceof HTTPError && /Username taken/g.test(e.message)) {
        toast(e.message);
        return;
      }

      const message = type === "signin" ? "Signin failed!" : "Signup failed!";
      toast(message);
    }
  }, [registerOrLogin, type, username, password, getDeviceId, create, onDone]);

  return (
    <>
      <Modal onClose={onDone} easyClose={false}>
        <FormWrapper>
          <FormContainer>
            <TextInput
              value={username}
              placeholder="Username"
              size="large"
              onChange={setUsername}
            />
            <TextInput
              value={password}
              placeholder="Password"
              size="large"
              onChange={setPassword}
              type="password"
            />
          </FormContainer>
          <LoginButton onClick={action}>
            {type === "signin" ? "Sign In" : "Sign Up"}
          </LoginButton>
          <>
            <Rule />
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
          </>
        </FormWrapper>
      </Modal>
    </>
  );
};

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1em;
  justify-content: center;
  align-items: center;
  width: 80%;
`;

const Rule = styled.hr`
  width: 60%;
`;

const SwitchTypeSpan = styled.span`
  cursor: pointer;
  color: #95b0ff;
  font-weight: 500;
  font-size: 1.1em;
`;

const FormWrapper = styled.div`
  width: 25vw;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 2em;
  padding: 2vh 0;
`;

const LoginButton = styled.button`
  width: 80%;
  background-color: #646cff;
`;
