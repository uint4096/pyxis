import "./App.css";
import { useCallback, useEffect, useState, useReducer, ChangeEventHandler } from "react";
import { Loro, LoroText } from "loro-crdt";
import { getStepsForTransformation } from "string-differ";

function App() {
  const [socket, setSocket] = useState<WebSocket>();
  const [loroText, setLoroText] = useState<LoroText>();
  const [loroDoc, setLoroDoc] = useState<Loro>();
  const [_, forceUpdate] = useReducer((x) => x + 1, 0);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");
    socket.binaryType = "arraybuffer";
    socket.addEventListener("message", async (event) => {
      const remoteDoc = new Uint8Array(event.data);
      loroDoc?.import(remoteDoc);
      forceUpdate();
    });

    setSocket(socket);

    return () => {
      socket.close();
    };
  }, [loroDoc]);

  useEffect(() => {
    if (loroDoc) {
      setLoroText(loroDoc.getText("newdoc"));
    }
  }, [loroDoc]);

  useEffect(() => {
    const doc = new Loro();
    const loroText = doc.getText("newdoc");

    setLoroText(loroText);
    setLoroDoc(doc);

    return () => {
      // Sync before unmount
    };
  }, []);

  useEffect(() => {
    if (online && loroDoc) {
      const snapshot = loroDoc.exportFrom();
      socket?.send(snapshot);
    }
  }, [online, loroDoc]);

  const onEdit: ChangeEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      const diff = getStepsForTransformation("Range", {
        s1: loroText?.toString() ?? "",
        s2: event.currentTarget.value,
      });
      let positionCounter = 0;
      diff.forEach((step) => {
        switch (step.type) {
          case "insert": {
            loroText?.insert(positionCounter, step.value);
            positionCounter += 1;
            break;
          }
          case "delete": {
            const length = step.endIndex - step.startIndex + 1;
            loroText?.delete(positionCounter, length);
            positionCounter += length;
            break;
          }
          case "retain": {
            const length = step.endIndex - step.startIndex + 1;
            positionCounter += length;
            break;
          }
          default: {
            throw new Error("Unsupported Diff Operation!");
          }
        }
      });

      forceUpdate();

      if (online) {
        const snapshot = loroDoc?.exportFrom() ?? new Uint8Array();
        socket?.send(snapshot);
      }
    },
    [socket, loroDoc, loroText, online]
  );

  return (
    <>
      <div>
        <textarea
          rows={20}
          cols={150}
          onChange={onEdit}
          value={loroText?.toString() ?? ""}
        />
      </div>
      <div>
        <button onClick={() => setOnline((online) => !online)}>
          {online ? "Go Offline" : "Go Online"}
        </button>
      </div>
    </>
  );
}

export default App;
