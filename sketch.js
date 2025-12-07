// DREAM ORB – ENERGY RING VERSION (2D)
// 7 moods, each mood can have multiple songs.
// Visual: single glowing wavy ring with a hole in the middle.
// Colors change by mood + react softly to sound.

// ---------- GLOBALS ----------

let scenes;
let currentSceneIndex = 0;

let baseRadius;

// sound: tracks[moodIndex][trackIndex]
let tracks = [];
let amplitude;
let currentTrack = null;
let currentTrackIndex = 0;

// background gradient
let currentBgTop, currentBgBottom;
let bgTopTarget, bgBottomTarget;
const baseBgTop = "#050710";
const baseBgBottom = "#000000";

// ---------- SETUP ----------

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  baseRadius = min(windowWidth, windowHeight) * 0.22;

  // 7 moods – playlists ready
  scenes = [
    {
      name: "Calm",
      tagline: "soft blue, quiet breathing",
      orbColor: "#167ef4",
      lightColor: "#76b0ff",
      audioFiles: [
        "calm.mp3",
        // "calm2.mp3",
      ]
    },
    {
      name: "Happy",
      tagline: "warm yellow, gentle joy",
      orbColor: "#f0b30d",
      lightColor: "#ffd45c",
      audioFiles: [
        "happy.mp3",
        // "happy2.mp3",
      ]
    },
    {
      name: "Love",
      tagline: "soft pink, slow glow",
      orbColor: "#f66092",
      lightColor: "#ff94b8",
      audioFiles: [
        "love.mp3",
        // "love2.mp3",
        // "love3.mp3",
      ]
    },
    {
      name: "Dream",
      tagline: "lavender haze, drifting",
      orbColor: "#ad88f7",
      lightColor: "#c6a6ff",
      audioFiles: [
        "dream.mp3",
      ]
    },
    {
      name: "Hope",
      tagline: "mint air, quiet growth",
      orbColor: "#8af9b7",
      lightColor: "#b6ffd3",
      audioFiles: [
        "hope.mp3",
      ]
    },
    {
      name: "Nostalgia",
      tagline: "peach glow, far memories",
      orbColor: "#f88842",
      lightColor: "#ffb06e",
      audioFiles: [
        "nostalgia.mp3",
      ]
    },
    {
      name: "Alone",
      tagline: "blue-violet, soft sadness",
      orbColor: "#3b4bfa",
      lightColor: "#8b97ff",
      audioFiles: [
        "alone.mp3",
      ]
    }
  ];

  // background color state
  const s = scenes[currentSceneIndex];
  currentBgTop = color("#050710");
  currentBgBottom = color("#000000");
  bgTopTarget = makeBgTopForScene(s);
  bgBottomTarget = makeBgBottomForScene(s);

  // amplitude analyzer
  amplitude = new p5.Amplitude();
  amplitude.smooth(0.8);

  // load all audio files
  tracks = [];
  for (let i = 0; i < scenes.length; i++) {
    tracks[i] = [];
    for (let j = 0; j < scenes[i].audioFiles.length; j++) {
      const filePath = scenes[i].audioFiles[j]; // same folder as sketch.js
      loadSound(
        filePath,
        (snd) => {
          tracks[i][j] = snd;
          console.log("Loaded:", filePath);
        },
        (err) => {
          console.warn("Failed to load:", filePath);
          tracks[i][j] = null;
        }
      );
    }
  }

  setupLegendClicks();
  noCursor();
  textFont("Space Grotesk, system-ui, sans-serif");
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  baseRadius = min(windowWidth, windowHeight) * 0.22;
}

// ---------- BACKGROUND HELPERS ----------

function makeBgTopForScene(scene) {
  const baseTopCol = color(baseBgTop);
  const orbCol = color(scene.orbColor);
  return lerpColor(baseTopCol, orbCol, 0.35);
}

function makeBgBottomForScene(scene) {
  const baseBottomCol = color(baseBgBottom);
  const orbCol = color(scene.orbColor);
  return lerpColor(baseBottomCol, orbCol, 0.2);
}

function drawGradientBackground(levelBoost) {
  // blend towards target
  currentBgTop = lerpColor(currentBgTop, bgTopTarget, 0.04);
  currentBgBottom = lerpColor(currentBgBottom, bgBottomTarget, 0.04);

  let t = millis() * 0.0002;
  let bands = 120;
  noStroke();

  for (let i = 0; i <= bands; i++) {
    let amt = i / bands;
    let c = lerpColor(currentBgTop, currentBgBottom, amt);

    // tiny breathing brightness
    let breathe = 6 * sin(t * 2 + amt * PI * 2) * levelBoost;
    fill(
      red(c) + breathe,
      green(c) + breathe,
      blue(c) + breathe
    );

    let y = amt * height;
    rect(0, y, width, height / bands + 1);
  }
}

// ---------- MAIN DRAW ----------

function draw() {
  const scene = scenes[currentSceneIndex];

  let level = amplitude ? amplitude.getLevel() : 0;
  let levelBoost = constrain(map(level, 0, 0.3, 0, 1), 0, 1);

  drawGradientBackground(levelBoost);

  push();
  translate(width / 2, height / 2);
  drawEnergyOrb(scene, levelBoost);
  pop();

  drawHUD(scene);
}

// ---------- ENERGY ORB (RING) ----------

function drawEnergyOrb(scene, levelBoost) {
  const t = millis() * 0.001;

  let baseR = baseRadius;
  let noiseAmp = baseR * 0.18 * (0.4 + levelBoost * 0.9);
  let steps = 220;
  let orbCol = color(scene.orbColor);
  let lightCol = color(scene.lightColor);

  // soft outer glow (thicker, more transparent)
  for (let layer = 0; layer < 3; layer++) {
    let layerAlpha = 40 - layer * 10 + levelBoost * 25;
    let weight = 12 - layer * 3;

    stroke(
      red(orbCol),
      green(orbCol),
      blue(orbCol),
      layerAlpha
    );
    strokeWeight(weight);
    noFill();

    beginShape();
    for (let i = 0; i <= steps; i++) {
      let ang = (TWO_PI * i) / steps;
      let n = noise(
        cos(ang) * 1.5 + t * 0.5,
        sin(ang) * 1.5 + t * 0.5 + layer * 10
      );
      let offset = map(n, 0, 1, -noiseAmp, noiseAmp);
      let r = baseR + offset;

      let x = cos(ang) * r;
      let y = sin(ang) * r;
      vertex(x, y);
    }
    endShape();
  }

  // bright inner edge
  stroke(
    red(lightCol),
    green(lightCol),
    blue(lightCol),
    220
  );
  strokeWeight(4);
  noFill();

  beginShape();
  for (let i = 0; i <= steps; i++) {
    let ang = (TWO_PI * i) / steps;
    let n = noise(
      cos(ang) * 1.6 + t * 0.8,
      sin(ang) * 1.6 + t * 0.8
    );
    let offset = map(n, 0, 1, -noiseAmp * 0.6, noiseAmp * 0.6);
    let r = baseR + offset * (0.8 + levelBoost * 0.4);

    let x = cos(ang) * r;
    let y = sin(ang) * r;
    vertex(x, y);
  }
  endShape();

  // inner dark core so it feels like a hole
  noStroke();
  let holeR = baseR * 0.6;
  fill(0, 200);
  circle(0, 0, holeR * 2);

  // subtle tiny sparks in the ring
  let sparkCount = 26;
  for (let i = 0; i < sparkCount; i++) {
    let ang = (TWO_PI * i) / sparkCount + t * 0.6;
    let n = noise(
      cos(ang) * 2.2 + 100,
      sin(ang) * 2.2 + 200 + t
    );
    let offset = map(n, 0, 1, -noiseAmp * 0.4, noiseAmp * 0.4);
    let r = baseR + offset;

    let x = cos(ang) * r;
    let y = sin(ang) * r;

    let s = 6 + levelBoost * 8;
    fill(
      red(lightCol),
      green(lightCol),
      blue(lightCol),
      180
    );
    circle(x, y, s);
  }
}

// ---------- HUD ----------

function drawHUD(scene) {
  resetMatrix();
  textAlign(LEFT, BOTTOM);

  // mood + tagline
  fill(15, 15, 22, 220);
  noStroke();
  rect(18, height - 92, 260, 74, 16);

  fill(240);
  textSize(16);
  text(scene.name, 32, height - 54);

  textSize(12);
  fill(190);
  text(scene.tagline, 32, height - 36);

  // track info
  const mi = currentSceneIndex;
  const totalTracks = tracks[mi] ? tracks[mi].length : 0;
  if (totalTracks > 0) {
    fill(170);
    textSize(11);
    text(
      "Track " + (currentTrackIndex + 1) + " / " + totalTracks,
      32,
      height - 20
    );
  }

  // instructions
  fill(255, 255, 255, 210);
  textSize(10);
  text(
    "1–7: mood · C/Z/X: track 1/2/3 · Space: play/pause · click colors to change mood",
    32,
    height - 6
  );
}

// ---------- INTERACTION: MOOD + TRACK ----------

function setScene(index) {
  currentSceneIndex = (index + scenes.length) % scenes.length;
  const s = scenes[currentSceneIndex];

  bgTopTarget = makeBgTopForScene(s);
  bgBottomTarget = makeBgBottomForScene(s);

  currentTrackIndex = 0;
  updateLegendActive();
  switchAudioToCurrentScene();
}

function switchAudioToCurrentScene() {
  const mi = currentSceneIndex;
  const moodTracks = tracks[mi];
  const totalTracks = moodTracks ? moodTracks.length : 0;

  if (!totalTracks) {
    console.warn("No tracks loaded for mood:", mi);
    currentTrack = null;
    return;
  }

  if (currentTrackIndex < 0) currentTrackIndex = totalTracks - 1;
  if (currentTrackIndex >= totalTracks) currentTrackIndex = 0;

  if (currentTrack && currentTrack.isPlaying()) {
    currentTrack.stop();
  }

  currentTrack = moodTracks[currentTrackIndex];

  if (currentTrack) {
    currentTrack.loop();
    amplitude.setInput(currentTrack);
  } else {
    console.warn("Track not loaded for mood:", mi, "track:", currentTrackIndex);
  }
}

// jump to a specific track index inside the current mood
// 0 = first track, 1 = second, 2 = third, etc.
function jumpToTrackInCurrentMood(targetIndex) {
  const mi = currentSceneIndex;
  const moodTracks = tracks[mi];
  const totalTracks = moodTracks ? moodTracks.length : 0;
  if (!totalTracks) return;

  let idx = targetIndex;
  if (idx < 0) idx = 0;
  if (idx >= totalTracks) idx = totalTracks - 1;

  currentTrackIndex = idx;
  switchAudioToCurrentScene();
}

// ---------- LEGEND CLICKS (HTML) ----------

function setupLegendClicks() {
  const items = document.querySelectorAll(".legend-item");
  items.forEach((item) => {
    const idx = parseInt(item.dataset.index, 10);
    item.addEventListener("click", () => {
      userStartAudio();
      setScene(idx);
    });
  });
  updateLegendActive();
}

function updateLegendActive() {
  const items = document.querySelectorAll(".legend-item");
  items.forEach((item) => {
    const idx = parseInt(item.dataset.index, 10);
    if (idx === currentSceneIndex) {
      item.classList.add("is-active");
    } else {
      item.classList.remove("is-active");
    }
  });
}

// ---------- INPUT HANDLERS ----------

function keyPressed() {
  userStartAudio();

  // change mood
  if (key === "1") setScene(0);
  else if (key === "2") setScene(1);
  else if (key === "3") setScene(2);
  else if (key === "4") setScene(3);
  else if (key === "5") setScene(4);
  else if (key === "6") setScene(5);
  else if (key === "7") setScene(6);

  // play / pause
  else if (key === " ") {
    togglePlayPause();
  }

  // inside current mood: choose track
  // C = track 1 (index 0), Z = track 2 (index 1), X = track 3 (index 2)
  else if (key === "c" || key === "C") {
    jumpToTrackInCurrentMood(0);
  } else if (key === "z" || key === "Z") {
    jumpToTrackInCurrentMood(1);
  } else if (key === "x" || key === "X") {
    jumpToTrackInCurrentMood(2);
  }
}

function togglePlayPause() {
  if (!currentTrack) {
    switchAudioToCurrentScene();
    return;
  }

  if (currentTrack.isPlaying()) currentTrack.pause();
  else currentTrack.play();
}
