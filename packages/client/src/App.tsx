import { ToastContainer } from "react-toastify";
import "./App.css";
// import {
//   useCallback,
//   useEffect,
//   useState,
//   useReducer,
//   // ChangeEventHandler,
// } from "react";
// import { Loro, LoroText } from "loro-crdt";
// import { getStepsForTransformation } from "string-differ";
// import { useWebsockets } from "./hooks/useWebsockets";
// import Editor from "./pages/editor/editor";
import { Explorer } from "./pages/explorer";
import "react-toastify/dist/ReactToastify.css";
import { Option, Options } from "./pages/options";
import { UserSquare } from "./icons";

function App() {
  const options = (
    <Option
      icon={<UserSquare />}
      onClick={() => console.info("Clicked on user icon")}
    ></Option>
  );

  return (
    <>
      <Options>{[options]}</Options>
      <Explorer />
      <ToastContainer
        position={"bottom-right"}
        autoClose={3000}
        theme={"dark"}
        hideProgressBar
      />
      {/* <div>
        <button onClick={() => setOnline((online) => !online)}>
          {online ? "Go Offline" : "Go Online"}
        </button>
      </div> */}
    </>
  );
}

export default App;
