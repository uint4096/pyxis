import "react-toastify/dist/ReactToastify.css";
import "./App.css";

import { ToastContainer } from "react-toastify";
import { Explorer } from "./pages/explorer";
import { useEffect, useState } from "react";
import { useConfig, useDevices, useOffline } from "./store";
import { useAuthRequests, useSync, useSyncRequests } from "./hooks";
import { ConfigResponse, getLoggedInUser } from "./ffi";
import { ky } from "./utils";
import { jwtDecode } from "jwt-decode";
import { AccountForm } from "./pages/configuration/modals";
import { styled } from "@linaria/react";

type DecodedToken = {
  user: Pick<ConfigResponse, "user_id" | "username">;
  exp: number;
};

function App() {
  const {
    create: modifyConfig,
    config,
    setConfig,
    delete: deleteConfig,
  } = useConfig();
  const { create: addDevices } = useDevices();
  const { initDevices } = useSyncRequests();
  const { setStatus, status } = useOffline();
  const { getFeatures, logout } = useAuthRequests();
  const { syncDocuments } = useSync();

  const [showAccountsForm, setAccountsForm] = useState(false);

  const decodeToken = (token: string): DecodedToken | null => {
    try {
      return jwtDecode(token);
    } catch (e) {
      console.error("[Auth] Error while decoding token!", e);
      return null;
    }
  };

  useEffect(() => {
    const ping = async () => {
      try {
        await ky.get("/sync/ping");
        setStatus("online");
      } catch {
        setStatus("offline");
      }
    };

    (async () => await ping())();
    const interval = setInterval(ping, 5000);

    return () => clearInterval(interval);
  }, [setStatus]);

  useEffect(() => {
    (async () => {
      const userDetails = await getLoggedInUser();
      if (!userDetails?.userToken) {
        setAccountsForm(true);
        return;
      }

      setAccountsForm(false);
      const decodedToken = decodeToken(userDetails.userToken);
      const currentTime = new Date().getTime();
      if (!decodedToken || decodedToken.exp * 1000 < currentTime) {
        await logout();
        await deleteConfig(userDetails.userId!);
        return;
      }

      await setConfig(userDetails);
    })();
  }, [deleteConfig, logout, setConfig]);

  useEffect(() => {
    if (
      !config?.userToken ||
      !config?.userId ||
      !config?.username ||
      !config?.deviceId
    ) {
      return;
    }

    (async () => {
      const [{ response: featuresResponse }, { response: devicesResponse }] =
        await Promise.all([getFeatures(config.userId!), initDevices()]);

      await modifyConfig(
        config.username!,
        config.userId!,
        config.userToken!,
        config.deviceId!,
        featuresResponse?.features?.features,
      );

      const deviceIds = devicesResponse?.devices;
      await addDevices(devicesResponse?.devices ?? []);
      const devicesToSync = deviceIds?.filter((id) => id !== config.deviceId);
      try {
        await syncDocuments(config.userId!, devicesToSync ?? []);
      } catch (e) {
        console.error("Failed to sync. Error: ", e);
      }
    })();
  }, [
    config.username,
    config.userToken,
    config.deviceId,
    config.userId,
    getFeatures,
    modifyConfig,
    status,
    initDevices,
    addDevices,
    syncDocuments,
  ]);

  return (
    <>
      <AppWrapper>
        {config.userToken && <Explorer />}
        {showAccountsForm && (
          <AccountForm onDone={() => setAccountsForm(false)} />
        )}
      </AppWrapper>
      <ToastContainer
        position={"bottom-right"}
        autoClose={3000}
        theme={"dark"}
        hideProgressBar
      />
    </>
  );
}

const AppWrapper = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
`;

export default App;
