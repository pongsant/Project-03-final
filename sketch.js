// MUSIC ORB – VIBE-REACTIVE BLOB + SIMPLE GRADIENT BACKGROUND
//
// Controls:
//  - Left drag: orbit around orb
//  - Scroll: zoom
//  - Right click: next mood
//  - 1–7: pick mood
//  - Space: play / pause
//  - C / Z / X: tracks 1 / 2 / 3 in current mood
//  - Click legend item (.legend-item) to change mood

// ---------- GLOBALS ----------

// mood definitions (colors + description + track filenames)
let scenes = [
  {
    name: "Calm",
    orbColor: "#167ef4",
    lightColor: "#6bd9ff",
    bgTop: "#050616",
    bgBottom: "#0f1a42",
    tracks: ["calm.mp3"]
  },
  {
    name: "Happy",
    orbColor: "#f0b30d",
    lightColor: "#ffe15c",
    bgTop: "#1e1020",
    bgBottom: "#402214",
    tracks: ["happy.mp3"]
  },
  {
    name: "Love",
    orbColor: "#f66092",
    lightColor: "#ffb3cf",
    bgTop: "#1a0614",
    bgBottom: "#401429",
    tracks: ["love.mp3"]
  },
  {
    name: "Dream",
    orbColor: "#ad88f7",
    lightColor: "#d9c6ff",
    bgTop: "#08041a",
    bgBottom: "#2a1b5f",
    tracks: ["dream.mp3"]
  },
  {
    name: "Hope",
    orbColor: "#8af9b7",
    lightColor: "#bfffe0",
    bgTop: "#031a14",
    bgBottom: "#134834",
    tracks: ["hope.mp3"]
  },
  {
    name: "Nostalgia",
    orbColor: "#f89a55",
    lightColor: "#ffd1a0",
    bgTop: "#1a0e05",
    bgBottom: "#462511",
    tracks: ["nostalgia.mp3"]
  },
  {
    name: "Alone",
    orbColor: "#3b4bfa",
    lightColor: "#b0b3ff",
    bgTop: "#020514",
    bgBottom: "#0f153d",
    tracks: ["alone.mp3"]
  }
];

let currentSceneIndex = 0;
let currentTrackIndex = 0;

// sounds: scenes[i].soundFiles[j]
let scenesSounds = [];

// audio analysis
let amp;
let smoothedLevel = 0;

// background colors
let bgTopCurrent, bgTopTarget;
let bgBottomCurrent, bgBottomTarget;

// orb animation
let baseRotation = 0;
let noiseOffset = 0;

// camera
let isDragging = false;
let lastMouseX, lastMouseY;
let camRotX = -0.3;
let camRotY = 0.4;
let camDistance = 420;

// current playing track
let currentTrack = null;

/* -------------------------------------------------- */
/* preload                                             */
/* -------------------------------------------------- */
function preload() {
  scenesSounds = scenes.map((scene) =>
    scene.tracks.map((file) => loadSound(file))
  );
}

/* -------------------------------------------------- */
/* setup                                               */
/* -------------------------------------------------- */
function setup() {
  const cnv = createCanvas(windowWidth, windowHeight, WEBGL);
  pixelDensity(1);
  cnv.elt.oncontextmenu = () => false; // disable right-click menu on canvas

  amp = new p5.Amplitude();
  amp.smooth(0.9);

  // initial background colors
  const s = scenes[currentSceneIndex];
  bgTopCurrent = color(s.bgTop);
  bgBottomCurrent = color(s.bgBottom);
  bgTopTarget = color(s.bgTop);
  bgBottomTarget = color(s.bgBottom);

  switchAudioToCurrentScene();
  updateLegendActive();

  textFont("Space Grotesk, system-ui, sans-serif");
}

/* -------------------------------------------------- */
/* draw                                                */
/* -------------------------------------------------- */
function draw() {
  // draw gradient background
  drawBrightBackground();

  // camera control
  push();
  if (isDragging) {
    const dx = (mouseX - lastMouseX) * 0.01;
    const dy = (mouseY - lastMouseY) * 0.01;
    camRotY += dx;
    camRotX += dy;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
  }

  rotateX(camRotX);
  rotateY(camRotY);
  translate(0, 0, -camDistance);

  const scene = scenes[currentSceneIndex];
  const orbCol = color(scene.orbColor);
  const lightCol = color(scene.lightColor);

  // lights
  ambientLight(20);
  directionalLight(
    red(lightCol) * 0.9,
    green(lightCol) * 0.9,
    blue(lightCol) * 0.9,
    -0.3,
    -0.5,
    -1
  );
  pointLight(
    red(lightCol),
    green(lightCol),
    blue(lightCol),
    0,
    -150,
    200
  );

  // audio level
  const level = amp.getLevel();
  smoothedLevel = lerp(smoothedLevel, level, 0.18);

  baseRotation += 0.01 + smoothedLevel * 0.12;
  noiseOffset += 0.01;

  // soft aura under orb
  push();
  rotateX(HALF_PI);
  noStroke();

  let auraSize = 260 + smoothedLevel * 850;
  for (let i = 5; i >= 1; i--) {
    const alpha = map(i, 1, 5, 85, 0);
    fill(
      red(orbCol),
      green(orbCol),
      blue(orbCol),
      alpha
    );
    ellipse(0, 0, auraSize * (i / 5), auraSize * 0.36 * (i / 5));
  }
  pop();

  // orb – a jelly-like deformed sphere
  push();
  translate(0, -40, 0);
  rotateY(baseRotation);
  rotateX(baseRotation * 0.35);

  const baseRadius = 95;
  const spikeAmount = 55 * (0.4 + smoothedLevel * 3.0);

  noStroke();
  ambientMaterial(
    red(orbCol) * 1.1,
    green(orbCol) * 1.1,
    blue(orbCol) * 1.1
  );

  const detail = 40;
  beginShape(TRIANGLE_STRIP);
  for (let i = 0; i <= detail; i++) {
    const lat1 = map(i, 0, detail, -HALF_PI, HALF_PI);
    const lat2 = map(i + 1, 0, detail, -HALF_PI, HALF_PI);

    for (let j = 0; j <= detail; j++) {
      const lon = map(j, 0, detail, 0, TWO_PI);

      // first row
      let x1 = cos(lat1) * cos(lon);
      let y1 = sin(lat1);
      let z1 = cos(lat1) * sin(lon);

      let n1 = noise(
        x1 * 1.3 + noiseOffset,
        y1 * 1.3 + noiseOffset,
        z1 * 1.3 + noiseOffset
      );
      let r1 = baseRadius + spikeAmount * (n1 - 0.4);

      vertex(x1 * r1, y1 * r1, z1 * r1);

      // second row
      let x2 = cos(lat2) * cos(lon);
      let y2 = sin(lat2);
      let z2 = cos(lat2) * sin(lon);

      let n2 = noise(
        x2 * 1.3 + noiseOffset,
        y2 * 1.3 + noiseOffset,
        z2 * 1.3 + noiseOffset
      );
      let r2 = baseRadius + spikeAmount * (n2 - 0.4);

      vertex(x2 * r2, y2 * r2, z2 * r2);
    }
  }
  endShape();

  pop(); // orb
  pop(); // camera
}

/* -------------------------------------------------- */
/* background gradient                                */
/* -------------------------------------------------- */
function drawBrightBackground() {
  push();
  resetMatrix();
  translate(-width / 2, -height / 2);

  // lerp towards target colors
  bgTopCurrent = lerpColor(bgTopCurrent, bgTopTarget, 0.04);
  bgBottomCurrent = lerpColor(bgBottomCurrent, bgBottomTarget, 0.04);

  const steps = 140;
  noStroke();
  for (let i = 0; i < steps; i++) {
    const amt = i / (steps - 1);
    const c = lerpColor(bgTopCurrent, bgBottomCurrent, amt);
    fill(c);
    rect(0, (height * i) / steps, width, height / steps + 1);
  }

  pop();
}

/* -------------------------------------------------- */
/* audio helpers                                      */
/* -------------------------------------------------- */
function switchAudioToCurrentScene() {
  const moodIndex = currentSceneIndex;
  const moodSounds = scenesSounds[moodIndex];
  if (!moodSounds || moodSounds.length === 0) {
    if (currentTrack && currentTrack.isPlaying()) {
      currentTrack.stop();
    }
    currentTrack = null;
    return;
  }

  if (currentTrackIndex < 0) currentTrackIndex = moodSounds.length - 1;
  if (currentTrackIndex >= moodSounds.length) currentTrackIndex = 0;

  if (currentTrack && currentTrack.isPlaying()) {
    currentTrack.stop();
  }

  currentTrack = moodSounds[currentTrackIndex];
  if (currentTrack) {
    amp.setInput(currentTrack);
  }
}

function jumpToTrackInCurrentMood(targetIndex) {
  const moodIndex = currentSceneIndex;
  const moodSounds = scenesSounds[moodIndex];
  if (!moodSounds || moodSounds.length === 0) return;

  let idx = targetIndex;
  if (idx < 0) idx = moodSounds.length - 1;
  if (idx >= moodSounds.length) idx = 0;

  if (currentTrack && currentTrack.isPlaying()) {
    currentTrack.stop();
  }

  currentTrackIndex = idx;
  currentTrack = moodSounds[currentTrackIndex];
  amp.setInput(currentTrack);
  currentTrack.play();
}

/* -------------------------------------------------- */
/* scene switching                                    */
/* -------------------------------------------------- */
function setScene(index) {
  currentSceneIndex = (index + scenes.length) % scenes.length;
  const s = scenes[currentSceneIndex];

  bgTopTarget = color(s.bgTop);
  bgBottomTarget = color(s.bgBottom);

  currentTrackIndex = 0;
  updateLegendActive();
  switchAudioToCurrentScene();
}

/* -------------------------------------------------- */
/* legend UI                                          */
/* -------------------------------------------------- */
function updateLegendActive() {
  const items = document.querySelectorAll(".legend-item");
  if (!items) return;
  items.forEach((li) => {
    const idx = parseInt(li.dataset.index, 10);
    li.classList.toggle("is-active", idx === currentSceneIndex);
  });
}

function setupLegendClicks() {
  const items = document.querySelectorAll(".legend-item");
  if (!items) return;

  items.forEach((li) => {
    const idx = parseInt(li.dataset.index, 10);
    li.addEventListener("click", () => {
      userStartAudio();
      setScene(idx);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupLegendClicks();
});

/* -------------------------------------------------- */
/* input handlers                                     */
/* -------------------------------------------------- */
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
    if (!currentTrack) {
      switchAudioToCurrentScene();
      if (currentTrack) currentTrack.play();
    } else {
      if (currentTrack.isPlaying()) currentTrack.pause();
      else currentTrack.play();
    }
  }

  // track selection in current mood (C/Z/X)
  else if (key === "c" || key === "C") {
    jumpToTrackInCurrentMood(0);
  } else if (key === "z" || key === "Z") {
    jumpToTrackInCurrentMood(1);
  } else if (key === "x" || key === "X") {
    jumpToTrackInCurrentMood(2);
  }
}

// right click = next mood, left drag = orbit
function mousePressed() {
  userStartAudio();

  if (mouseButton === RIGHT) {
    setScene(currentSceneIndex + 1);
  } else if (mouseButton === LEFT) {
    isDragging = true;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
  }
}

function mouseReleased() {
  if (mouseButton === LEFT) {
    isDragging = false;
  }
}

function mouseWheel(event) {
  camDistance += event.delta * 0.4;
  camDistance = constrain(camDistance, 260, 820);
}

/* -------------------------------------------------- */
/* resize                                             */
/* -------------------------------------------------- */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight, WEBGL);
}
