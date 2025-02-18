import { useCallback, useEffect, useRef, useState } from "react";
import { FaUser } from "react-icons/fa";
import { Option } from "./wrappers";
import { useConfig, useOffline } from "../../store";
import { Features } from "../../ffi";
import { useAuthRequests, useOutsideEvent } from "../../hooks";
import { styled } from "@linaria/react";
import { BiSolidUser } from "react-icons/bi";
import Switch from "react-switch";
import { toast, noop } from "../../utils";

export const Account = () => {
  const [showOverflow, setOverflow] = useState(false);
  const [buttonStatus, setButtonStatus] = useState(true);
  const { config } = useConfig();

  const { getStatus } = useOffline();

  const { logout, requestFeatureAccess } = useAuthRequests();
  const { delete: removeTokenFromStore, create: modifyConfig } = useConfig();
  const optionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (getStatus() === "offline") {
      setButtonStatus(false);
    } else {
      setButtonStatus(true);
    }
  }, [getStatus]);

  useOutsideEvent(optionsRef, () => {
    setOverflow(false);
  });

  const signout = useCallback(async () => {
    if (!config?.userToken) {
      throw new Error("No token!");
    }

    try {
      const { status } = await logout();

      if (status === "offline") {
        toast(
          "We can't reach our servers. Signing out requires network connection!",
        );
        return;
      }

      await removeTokenFromStore(config.userId!);
      setOverflow(false);
    } catch (e) {
      console.error("[Auth] Logout failed!");
      toast("Sign out failed!");
    }
  }, [config?.userToken, config.userId, logout, removeTokenFromStore]);

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
        } else {
          toast(
            "We can't reach our servers. This action requires network connection!",
          );
        }
      } catch (e) {
        console.error("[Auth] Subscription request failed!");
        toast("Subscription request failed!");
      }
    },
    [config, requestFeatureAccess, modifyConfig],
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
    <Wrapper
      ref={optionsRef}
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Escape" ? setOverflow(false) : noop())}
    >
      <Option
        icon={<FaUser size={18} />}
        onClick={() => setOverflow((overflow) => !overflow)}
      />
      {showOverflow && (
        <Menu>
          <UserContainer>
            <BiSolidUser color="#9a9999" />
            <Username>{config.username}</Username>
          </UserContainer>
          <Rule />
          <SyncFeatureWrapper>
            <FeatureName>Sync</FeatureName>
            {config.features?.["sync"]?.[1] !== "enabled" &&
              config.features?.["sync"]?.[1] !== "requested" && (
                <AccessRequestButton
                  onClick={() => requestFeature("sync")}
                  disabled={!buttonStatus}
                >
                  Request Access
                </AccessRequestButton>
              )}
            {config.features?.["sync"]?.[1] !== "enabled" &&
              config.features?.["sync"]?.[1] === "requested" && (
                <AccessRequestButton
                  onClick={() => requestFeature("sync")}
                  disabled
                >
                  Requested
                </AccessRequestButton>
              )}
            {config.features?.["sync"]?.[1] === "enabled" && (
              <Switch
                onColor="#646cff"
                checkedIcon={false}
                uncheckedIcon={false}
                checked={!!config.features?.["sync"]?.[0]}
                onChange={(status) => handleSyncToggle(status)}
              />
            )}
          </SyncFeatureWrapper>
          <LogoutButton onClick={signout}>Sign out</LogoutButton>
        </Menu>
      )}
    </Wrapper>
  );
};

const FeatureName = styled.span`
  font-weight: 600;
  color: #c2c2c2;
`;

const SyncFeatureWrapper = styled.div`
  display: flex;
  justify-content: space-around;
  padding: 4vh 0;
  gap: 1.5em;
  align-items: center;
`;

const Wrapper = styled.div`
  position: relative;
  &:focus {
    outline: none;
  }
`;

const UserContainer = styled.div`
  display: flex;
  padding: 0 1vw;
  gap: 1em;
  width: 100%;
  justify-content: center;

  & * {
    align-self: center;
  }
`;

const Rule = styled.hr`
  width: 100%;
  opacity: 0.5;
  margin-top: 1vh;
`;

const Username = styled.span`
  font-weight: 600;
  align-self: flex-start;
`;

const LogoutButton = styled.button`
  background-color: #cf142b;
  font-size: 0.8em;
  width: 80%;

  &:hover {
    border-color: none;
  }
`;

const AccessRequestButton = styled.button`
  font-size: 0.8em;
  border-color: #646cff;

  &:disabled {
    background-color: #6a6a6a;
    cursor: not-allowed;
  }
`;

const Menu = styled.div`
  position: absolute;
  padding: 1vh 1vw;
  background-color: #000;
  opacity: 1;
  display: flex;
  flex-direction: column;
  border-radius: 5px;
  border: 1px solid #6a6a6a;
  bottom: 100%;
  margin-bottom: 2px;
  margin-left: 20px;
  font-size: 1em;
  width: 10vw;
  align-items: center;
  z-index: 9999;
`;
