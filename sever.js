// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from /public
app.use(express.static("public"));

// Shared orb state on the server
let orbState = {
  moodIndex: 0,     // which emotion (calm/happy/love/etc.)
  trackIndex: 0,    // which song inside that emotion playlist
  isPlaying: false,
  currentTime: 0,   // seconds
};

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Send current orb state to the new client
  socket.emit("state:init", orbState);

  // Mood or track changed
  socket.on("state:mood", (data) => {
    // data: { moodIndex, trackIndex, currentTime, isPlaying }
    if (typeof data.moodIndex === "number") {
      orbState.moodIndex = data.moodIndex;
    }
    if (typeof data.trackIndex === "number") {
      orbState.trackIndex = data.trackIndex;
    }
    if (typeof data.currentTime === "number") {
      orbState.currentTime = data.currentTime;
    }
    if (typeof data.isPlaying === "boolean") {
      orbState.isPlaying = data.isPlaying;
    }

    io.emit("state:mood", orbState);
  });

  // Play / pause
  socket.on("state:playPause", (data) => {
    if (typeof data.isPlaying === "boolean") {
      orbState.isPlaying = data.isPlaying;
    }
    if (typeof data.currentTime === "number") {
      orbState.currentTime = data.currentTime;
    }
    io.emit("state:playPause", orbState);
  });

  // Seek / scrub timeline
  socket.on("state:seek", (data) => {
    if (typeof data.currentTime === "number") {
      orbState.currentTime = data.currentTime;
    }
    io.emit("state:seek", orbState);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
