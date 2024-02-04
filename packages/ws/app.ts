import { WebSocket, WebSocketServer } from "ws";

(() => {
  const server = new WebSocketServer({
    port: 8080,
  });

  server.on("connection", (ws: WebSocket, req) => {
    console.log("New connection: ", req.socket.remoteAddress);
    ws.on("message", (message) => {

      // Broadcast to everyone but itself
      server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client !== ws) {
          client.send(message);
        }
      });
    });

    ws.on('close', () => {
      console.log("Connection closed");
    });

    server.on("error", (err) => {
      console.error("Websocket server errored! ", err.message);
    });
  });
})();
