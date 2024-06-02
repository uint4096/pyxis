import { useEffect, useState } from "react";

type WebsocketProps = {
  uri?: string;
  onMessage(message: ArrayBufferLike): void;
};

export const useWebsockets = ({ uri, onMessage }: WebsocketProps) => {
  const [socket, setSocket] = useState<WebSocket>();

  useEffect(() => {
    const socket = new WebSocket(uri ?? "ws://localhost:8080");
    socket.binaryType = "arraybuffer";
    socket.addEventListener("message", async (event) => {
      await onMessage(event.data);
    });

    setSocket(socket);
    return () => socket.close();
  }, [onMessage, uri]);

  return {
    sendMessage: (message: string | Uint8Array) => socket?.send(message),
  };
};
