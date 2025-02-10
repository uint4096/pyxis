import "react-toggle/style.css";
import { styled } from "@linaria/react";
import { useCallback, useState } from "react";

import { Modal } from "../../../components";
import { toast } from "../../../utils";
import { useConfig } from "../../../store";
import { UserSquare } from "../../../icons";
import { useAuthRequests } from "../../../hooks";
import { Config, Features } from "../../../ffi";
import Toggle from "react-toggle";

export const UserDetails = ({
  onDone,
  config,
}: {
  onDone: () => void;
  config: Config;
}) => {
  const { logout, requestFeatureAccess } = useAuthRequests();
  const { delete: removeTokenFromStore, create: modifyConfig } = useConfig();
  const [syncStatus, setSyncStatus] = useState(config.features?.["sync"]?.[0]);

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
      const featuresWithAddition: Features = features
        ? { ...features, [key]: [false, "requested"] }
        : { [key]: [false, "requested"] };

      try {
        const { status } = await requestFeatureAccess(key);

        if (status !== "offline") {
          await modifyConfig(
            username!,
            userId,
            userToken,
            deviceId,
            featuresWithAddition,
          );
        }

        onDone();
      } catch (e) {
        console.error("[Auth] Subscription request failed!");
        toast("Subscription request failed!");
      }
    },
    [config, requestFeatureAccess, modifyConfig, onDone],
  );

  const handleSyncToggle = useCallback(
    async (status: boolean) => {
      await modifyConfig(
        config.username!,
        config.userId!,
        config.userToken!,
        config.deviceId!,
        {
          ...config.features,
          sync: [
            status,
            config.features?.["sync"]?.[1] as Features[keyof Features][1],
          ],
        },
      );

      setSyncStatus(status);
    },
    [
      config.deviceId,
      config.features,
      config.userId,
      config.userToken,
      config.username,
      modifyConfig,
    ],
  );

  return (
    <>
      <Modal onClose={onDone} easyClose>
        <Wrapper>
          <UserContainer>
            <UserSquare width={36} height={36} stroke="#808080" />
            <Username>{config.username}</Username>
            <br />
            <SyncFeatureWrapper>
              <FeatureName>Sync</FeatureName>
              {config.features?.["sync"]?.[1] !== "enabled" &&
                config.features?.["sync"]?.[1] !== "requested" && (
                  <AccessRequestButton onClick={() => requestFeature("sync")}>
                    Request Access
                  </AccessRequestButton>
                )}
              {config.features?.["sync"]?.[1] !== "enabled" &&
                config.features?.["sync"]?.[1] === "requested" && (
                  <FeatureName>Requested</FeatureName>
                )}
              {config.features?.["sync"]?.[1] === "enabled" && (
                <Toggle
                  checked={syncStatus}
                  onChange={(e) => handleSyncToggle(e.target.checked)}
                  defaultChecked={false}
                  icons={false}
                />
              )}
            </SyncFeatureWrapper>
          </UserContainer>
          <LogoutButton onClick={signout}>Sign out</LogoutButton>
        </Wrapper>
      </Modal>
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
  width: 20vw;
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
