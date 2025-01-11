import { ToastContainer } from "react-toastify";
import "./App.css";
import { Explorer } from "./pages/explorer";
import "react-toastify/dist/ReactToastify.css";
import { ConfigurationTray } from "./pages/configuration";
import { useEffect } from "react";
import { useConfig } from "./store";
import { useSync } from "./hooks";

function App() {
  const { setConfig, config } = useConfig();
  const { initDevices, getDocuments } = useSync();

  useEffect(() => {
    (async () => {
      await setConfig();
    })();
  }, [setConfig]);

  useEffect(() => {
    (async () => {
      if (!config.userToken) {
        return;
      }

      const devices = await initDevices();
      const documents = await Promise.all(
        (devices ?? [])?.map(async (device) => await getDocuments(device)),
      );
      console.log(documents);
    })();
  }, [config.userToken, getDocuments, initDevices]);

  return (
    <>
      <ConfigurationTray />
      <Explorer />
      <ToastContainer
        position={"bottom-right"}
        autoClose={3000}
        theme={"dark"}
        hideProgressBar
      />
    </>
  );
}

export default App;
