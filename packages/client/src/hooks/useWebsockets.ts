import { useCallback, useEffect, useState } from "react";

type WebsocketProps = {
  uri?: string;
  onMessage(message: ArrayBufferLike): void;
};

export const useWebsockets = ({ uri, onMessage }: WebsocketProps) => {
  const [socket, setSocket] = useState<WebSocket>();

  const listener = useCallback(
    (event: MessageEvent<ArrayBufferLike>) => {
      console.log("On message called!");
      onMessage?.(event.data);
    },
    [onMessage],
  );

  useEffect(() => {
    const socket = new WebSocket(uri ?? "ws://localhost:8080");
    socket.binaryType = "arraybuffer";
    socket.addEventListener("message", listener);

    setSocket(socket);
    return () => {
      socket.removeEventListener("message", listener);
      socket.close();
    };
  }, [listener, onMessage, uri]);

  return {
    sendMessage: (message: string | Uint8Array) => socket?.send(message),
  };
};
