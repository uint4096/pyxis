import { styled } from "@linaria/react";
import { useCallback } from "react";

import { Modal } from "../../../components";
import { toast } from "../../../utils";
import { useConfig } from "../../../store";
import { UserSquare } from "../../../icons";
import { useAuthRequests } from "../../../hooks";

export const UserDetails = ({ onDone }: { onDone: () => void }) => {
  const { config, delete: removeTokenFromStore } = useConfig();
  const { logout } = useAuthRequests();

  const signout = useCallback(async () => {
    if (!config?.userToken) {
      throw new Error("No token!");
    }

    try {
      const { status } = await logout();

      if (status === "offline") {
        toast(
          "You seem to be offline. Signing out requires network connection!",
        );
        return;
      }

      await removeTokenFromStore();
      onDone();
    } catch (e) {
      console.error("[Auth] Logout failed!");
      toast("Sign out failed!");
    }
  }, [config?.userToken, logout, removeTokenFromStore, onDone]);

  const body = (
    <Wrapper>
      <UserContainer>
        <UserSquare width={36} height={36} stroke="#808080" />
        <Username>{config.username}</Username>
      </UserContainer>
      <LogoutButton onClick={signout}>Sign out</LogoutButton>
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
  align-items: center;
`;

const UserContainer = styled.div`
  display: flex;
  padding: 0.5em 1em;
  flex-direction: column;
  align-items: center;
  gap: 1em;
`;

const Username = styled.span`
  font-weight: 600;
  font-size: 2rem;
`;

const LogoutButton = styled.button`
  background-color: #cf142b;
  width: 60%;
`;
