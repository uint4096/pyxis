import { styled } from "@linaria/react";
import { useCallback } from "react";

import { Modal } from "../../../components";
import { toast } from "../../../utils";
import { useConfig } from "../../../store";
import { UserSquare } from "../../../icons";
import { useAuthRequests } from "../../../hooks";

export const UserDetails = ({ onDone }: { onDone: () => void }) => {
  const {
    config,
    delete: removeTokenFromStore,
    create: modifyConfig,
  } = useConfig();
  const { logout, requestFeatureAccess } = useAuthRequests();

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

      await removeTokenFromStore(config.userId!);
      onDone();
    } catch (e) {
      console.error("[Auth] Logout failed!");
      toast("Sign out failed!");
    }
  }, [config?.userToken, config.userId, logout, removeTokenFromStore, onDone]);

  const requestFeature = useCallback(
    async (key: string) => {
      if (!config?.userToken || !config?.userId || !config?.deviceId) {
        throw new Error("No token!");
      }

      const { deviceId, userId, userToken, username, features } = config;
      const featuresWithAddition = features
        ? { ...features, [key]: "requested" }
        : { [key]: "requested" };

      try {
        await requestFeatureAccess(key);
        await modifyConfig(
          username!,
          userId,
          userToken,
          deviceId,
          featuresWithAddition,
        );
        onDone();
      } catch (e) {
        console.error("[Auth] Logout failed!");
        toast("Sign out failed!");
      }
    },
    [config, requestFeatureAccess, modifyConfig, onDone],
  );

  const body = (
    <Wrapper>
      <UserContainer>
        <UserSquare width={36} height={36} stroke="#808080" />
        <Username>{config.username}</Username>
        <br />
        <SyncFeatureWrapper>
          <FeatureName>Sync</FeatureName>
          <AccessRequestButton onClick={() => requestFeature("sync")}>
            Request Access
          </AccessRequestButton>
        </SyncFeatureWrapper>
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

const FeatureName = styled.span`
  font-weight: 600;
  font-size: 1.5rem;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.5em 1em;
  gap: 2em;
  align-items: center;
`;

const SyncFeatureWrapper = styled.div`
  display: flex;
  justify-content: space-around;
  width: 50%;
`;

const UserContainer = styled.div`
  display: flex;
  padding: 0.5em 1em;
  flex-direction: column;
  align-items: center;
  gap: 1em;
  width: 100%;
`;

const Username = styled.span`
  font-weight: 600;
  font-size: 2rem;
`;

const LogoutButton = styled.button`
  background-color: #cf142b;
  width: 60%;
`;

const AccessRequestButton = styled.button`
  background-color: #96a4e5;
  width: 50%;
`;
