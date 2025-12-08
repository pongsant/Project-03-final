// server.js
// REALTIME MUSIC ORB SERVER (NO SUBFOLDERS)

const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);

// Serve all files in this folder (index.html, sketch.js, mp3, etc.)
app.use(express.static(__dirname));

// WebSocket server on /ws (works locally + on Render)
const wss = new WebSocket.Server({ server, path: "/ws" });

// Shared state for all users
let sharedState = {
  sceneIndex: 0,   // which mood (0–6)
  trackIndex: 0,   // which track inside that mood
  playing: false,  // play / pause
};

// Broadcast to all connected clients
function broadcastState() {
  const msg = JSON.stringify(sharedState);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

wss.on("connection", (ws) => {
  console.log("Client connected");

  // send current state to new client
  ws.send(JSON.stringify(sharedState));

  ws.on("message", (message) => {
    let data;
    try {
      data = JSON.parse(message.toString());
    } catch (e) {
      console.error("Invalid message:", message.toString());
      return;
    }

    if (data.type === "setScene") {
      const maxScenes = 7; // 0..6
      let idx = Math.floor(data.sceneIndex ?? 0);
      if (idx < 0) idx = 0;
      if (idx >= maxScenes) idx = maxScenes - 1;
      sharedState.sceneIndex = idx;
      sharedState.trackIndex = 0;
      broadcastState();
    } else if (data.type === "nextScene") {
      const maxScenes = 7;
      sharedState.sceneIndex = (sharedState.sceneIndex + 1) % maxScenes;
      sharedState.trackIndex = 0;
      broadcastState();
    } else if (data.type === "setTrack") {
      let idx = Math.floor(data.trackIndex ?? 0);
      if (idx < 0) idx = 0;
      sharedState.trackIndex = idx;
      sharedState.playing = true;
      broadcastState();
    } else if (data.type === "togglePlay") {
      sharedState.playing = !sharedState.playing;
      broadcastState();
    } else {
      console.log("Unknown message type:", data);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

// IMPORTANT: Render sets PORT in process.env.PORT
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
