import { styled } from "@linaria/react";
import { useCallback } from "react";

import { Modal } from "../../../components";
import { ky, toast } from "../../../utils";
import { useConfig } from "../../../store";
import { UserSquare } from "../../../icons";

export const UserDetails = ({ onDone }: { onDone: () => void }) => {
  const { config, delete: removeTokenFromStore } = useConfig();

  const logout = useCallback(async () => {
    try {
      await ky
        .post<void>("/auth/signout", {
          json: { device_id: config.deviceId, user_id: config.userId },
        })
        .json();

      await removeTokenFromStore();
      onDone();
    } catch (e) {
      console.error("[Auth] Logout failed!", e);
      toast("Sign out failed!");
    }
  }, [config.deviceId, config.userId, removeTokenFromStore, onDone]);

  const body = (
    <Wrapper>
      <UserContainer>
        <UserSquare />
        <span>{config.username}</span>
      </UserContainer>
      <LogoutButton onClick={logout}>Sign out</LogoutButton>
    </Wrapper>
  );

  return (
    <>
      <Modal body={body} size="medium" onClose={onDone} />
    </>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.5em 1em;
  gap: 2em;
`;

const UserContainer = styled.div`
  display: flex;
  padding: 0.5em 1em;
  flex-direction: column;
  justify-content: center;
  gap: 1em;
`;

const LogoutButton = styled.button`
  background-color: #cf142b;
`;
