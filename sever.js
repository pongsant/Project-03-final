// server.js
// Node + WebSocket server to sync mood + song between all users

const path = require("path");
const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);

// Serve static files from this folder (index.html, sketch.js, mp3s, etc.)
app.use(express.static(path.join(__dirname)));

const wss = new WebSocket.Server({ server, path: "/ws" });

// Shared state for everyone
let state = {
  sceneIndex: 0,   // which mood (0–6)
  trackIndex: 0,   // which track inside that mood (0–2)
  isPlaying: false // is music playing?
};

function broadcast(msg, exceptSocket = null) {
  const data = JSON.stringify(msg);
  wss.clients.forEach((client) => {
    if (client !== exceptSocket && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

wss.on("connection", (ws) => {
  console.log("Client connected");

  // Send current global state to new client
  ws.send(
    JSON.stringify({
      type: "fullState",
      sceneIndex: state.sceneIndex,
      trackIndex: state.trackIndex,
      isPlaying: state.isPlaying
    })
  );

  ws.on("message", (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch (err) {
      console.error("Bad message:", err);
      return;
    }

    switch (msg.type) {
      case "setScene":
        state.sceneIndex = msg.index ?? 0;
        state.trackIndex = 0; // reset track when mood changes
        broadcast({ type: "setScene", index: state.sceneIndex }, ws);
        break;

      case "jumpTrack":
        state.trackIndex = msg.trackIndex ?? 0;
        broadcast({ type: "jumpTrack", trackIndex: state.trackIndex }, ws);
        break;

      case "togglePlay":
        state.isPlaying = !state.isPlaying;
        broadcast({ type: "setPlayState", isPlaying: state.isPlaying }, ws);
        break;

      default:
        console.log("Unknown message type:", msg.type);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
