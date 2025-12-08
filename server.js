// sever.js
// REALTIME MUSIC ORB SERVER (NO SUBFOLDERS, USING "ws")

const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);

// Serve all files in this folder (index.html, sketch.js, .mp3, etc.)
app.use(express.static(__dirname));

// WebSocket server
const wss = new WebSocket.Server({ server });

// Shared state for all users
// sceneIndex: which mood (0–6)
// trackIndex: which track inside that mood (if you add more later)
// playing: is music playing or not
let sharedState = {
  sceneIndex: 0,
  trackIndex: 0,
  playing: false,
};

// Broadcast full state to all connected clients
function broadcastState() {
  const msg = JSON.stringify(sharedState);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

// Handle new clients
wss.on("connection", (ws) => {
  console.log("Client connected");

  // Send current state to new client
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
      // optional: reset track when mood changes
      sharedState.trackIndex = 0;
      broadcastState();
    } else if (data.type === "nextScene") {
      const maxScenes = 7; // 0..6
      sharedState.sceneIndex = (sharedState.sceneIndex + 1) % maxScenes;
      sharedState.trackIndex = 0;
      broadcastState();
    } else if (data.type === "setTrack") {
      let idx = Math.floor(data.trackIndex ?? 0);
      if (idx < 0) idx = 0;
      // you can clamp here later if a mood has more tracks
      sharedState.trackIndex = idx;
      // when changing track, start playing
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
