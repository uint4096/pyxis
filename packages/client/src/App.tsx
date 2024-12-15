import { ToastContainer } from "react-toastify";
import "./App.css";
import { Explorer } from "./pages/explorer";
import "react-toastify/dist/ReactToastify.css";
import { ConfigurationTray } from "./pages/configuration";
import { useEffect } from "react";
import { useConfig } from "./store";

function App() {
  const { setConfig } = useConfig();

  useEffect(() => {
    (async () => await setConfig())();
  }, [setConfig]);

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
