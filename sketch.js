// MUSIC ORB — single user + Unity sync
// -----------------------------------

let moods = [
  {
    id: "calm",
    name: "Calm",
    orbColor: "#5F97FF",      // deeper blue
    topColor: "#BFD8FF",
    bottomColor: "#E8F1FF",
    file: "calm.mp3"
  },
  {
    id: "happy",
    name: "Happy",
    orbColor: "#FFC837",       // stronger yellow-gold
    topColor: "#FFE7A1",
    bottomColor: "#FFF5D9",
    file: "happy.mp3"
  },
  {
    id: "love",
    name: "Love",
    orbColor: "#FF5F9F",      // richer rose-pink
    topColor: "#FFB7D4",
    bottomColor: "#FFE4EE",
    file: "love.mp3"
  },
  {
    id: "dream",
    name: "Dream",
    orbColor: "#A883FF",      // deeper lavender
    topColor: "#D9C8FF",
    bottomColor: "#F2EBFF",
    file: "dream.mp3"
  },
  {
    id: "hope",
    name: "Hope",
    orbColor: "#5FFFC9",      // brighter mint
    topColor: "#C4FFEB",
    bottomColor: "#EDFFF8",
    file: "hope.mp3"
  },
  {
    id: "nostalgia",
    name: "Nostalgia",
    orbColor: "#FF9550",      // warmer orange
    topColor: "#FFD1B0",
    bottomColor: "#FFEBDC",
    file: "nostalgia.mp3"
  },
  {
    id: "alone",
    name: "Alone",
    orbColor: "#6574FF",      // cooler, deeper blue-violet
    topColor: "#C3C8FF",
    bottomColor: "#EEF0FF",
    file: "alone.mp3"
  }
];


let sounds = [];          // loaded p5.SoundFile objects
let currentMoodIndex = 0; // which mood we’re on
let currentSound = null;

let amplitude;
let baseRadius;
let angle = 0;

// background colors (p5.Color)
let bgTop, bgBottom, bgTopTarget, bgBottomTarget;

// audio animation helpers
let beatSmoothed = 0;
let vibeSmoothed = 0;

// audio permission state
let audioStarted = false;

// ----------------- PRELOAD -----------------

function preload() {
  // load all sounds
  for (let m of moods) {
    sounds.push(loadSound(m.file));
  }
}

// ----------------- SETUP -----------------

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
  angleMode(RADIANS);

  amplitude = new p5.Amplitude();
  amplitude.smooth(0.8);

  baseRadius = min(windowWidth, windowHeight) * 0.18;

  // initial background
  const m = moods[currentMoodIndex];
  bgTop = color(m.topColor);
  bgBottom = color(m.bottomColor);
  bgTopTarget = bgTop;
  bgBottomTarget = bgBottom;

  setupLegendClicks();
  applyMood(0); // set initial mood visuals + Unity sync (no sound yet)
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight, WEBGL);
  baseRadius = min(windowWidth, windowHeight) * 0.18;
}

// ----------------- DRAW -----------------

function draw() {
  // smooth gradient background
  bgTop = lerpColor(bgTop, bgTopTarget, 0.03);
  bgBottom = lerpColor(bgBottom, bgBottomTarget, 0.03);
  drawGradientBackground(bgTop, bgBottom);

  // audio-based animation
  let level = 0;
  if (currentSound && currentSound.isPlaying()) {
    level = amplitude.getLevel();
  }

  // vibe mostly from volume
  let rawVibe = constrain(map(level, 0, 0.35, 0, 1), 0, 1);
  vibeSmoothed = lerp(vibeSmoothed, rawVibe, 0.12);

  // smaller “beat” pulse
  let rawBeat = constrain(map(level, 0, 0.5, 0, 1), 0, 1);
  beatSmoothed = lerp(beatSmoothed, rawBeat, 0.2);

  drawOrb(beatSmoothed, vibeSmoothed);
}

// ----------------- BACKGROUND + ORB -----------------

function drawGradientBackground(topCol, bottomCol) {
  resetMatrix();
  ortho();
  push();
  noStroke();

  beginShape();
  fill(topCol);
  vertex(-width / 2, -height / 2, -1);
  vertex(width / 2, -height / 2, -1);
  fill(bottomCol);
  vertex(width / 2, height / 2, -1);
  vertex(-width / 2, height / 2, -1);
  endShape(CLOSE);

  pop();
  resetMatrix();
}

function drawOrb(beat, vibe) {
  const mood = moods[currentMoodIndex];
  const orbColor = color(mood.orbColor);
  const lightColor = color(mood.topColor);

  // base radius
  let r = baseRadius;
  r += beat * baseRadius * 0.4;
  r += sin(frameCount * 0.01) * baseRadius * 0.05;

  angle += 0.01 + vibe * 0.03;

  // lighting
  ambientLight(40);
  directionalLight(
    red(lightColor),
    green(lightColor),
    blue(lightColor),
    -0.3,
    -0.4,
    -0.6
  );

  rotateY(angle * 0.8);
  rotateX(angle * 0.35);

  // outer shell
  push();
  const orbCol = lerpColor(orbColor, color(255), 0.15 + vibe * 0.15);
  ambientMaterial(orbCol);
  shininess(80);
  sphere(r, 72, 64);
  pop();

  // inner core
  push();
  let innerR = r * (0.55 + vibe * 0.05);
  rotateY(-angle * 1.2);
  rotateX(angle * 0.7);
  ambientMaterial(255, 255, 255, 230);
  sphere(innerR, 40, 32);
  pop();

  // small floating “petals”
  const dotCount = 32;
  for (let i = 0; i < dotCount; i++) {
    const t = (i / dotCount) * TWO_PI;
    const band = (i % 3) / 3;
    const rr = r * (1.05 + band * 0.12 + vibe * 0.05);
    const wobble = sin(angle * 1.5 + i * 0.4) * r * 0.08 * (0.3 + band);

    const x = cos(t + angle * (0.6 + band * 0.2)) * rr;
    const y = sin(t * 1.2 + angle * (0.4 + band * 0.3)) * rr * 0.4;
    const z = sin(t + angle * (0.9 + band * 0.1)) * (rr * 0.6 + wobble);

    push();
    translate(x, y, z);
    const dotAlpha = 140 + 60 * band;
    const dotCol = lerpColor(orbColor, lightColor, 0.4 + 0.3 * band);
    ambientMaterial(red(dotCol), green(dotCol), blue(dotCol), dotAlpha);
    sphere(6 + band * 3, 10, 8);
    pop();
  }
}

// ----------------- MOOD / AUDIO LOGIC -----------------

function applyMood(index) {
  currentMoodIndex = (index + moods.length) % moods.length;
  const mood = moods[currentMoodIndex];

  // background targets
  bgTopTarget = color(mood.topColor);
  bgBottomTarget = color(mood.bottomColor);

  // update legend highlight
  updateLegendActive();

  // stop previous sound
  if (currentSound && currentSound.isPlaying()) {
    currentSound.stop();
  }

  // set new sound
  currentSound = sounds[currentMoodIndex];

  // start if user already allowed audio
  if (audioStarted && currentSound && !currentSound.isPlaying()) {
    currentSound.loop();
    currentSound.setVolume(0.85);
  }

  // tell Unity the new mood
  syncMoodToUnity(mood.name); // "Calm", "Happy", etc.
}

function nextMood() {
  applyMood(currentMoodIndex + 1);
}

function userStartAudioIfNeeded() {
  if (!audioStarted) {
    audioStarted = true;
    const ctx = getAudioContext();
    if (ctx.state !== "running") {
      ctx.resume();
    }
    // start current track
    if (currentSound && !currentSound.isPlaying()) {
      currentSound.loop();
      currentSound.setVolume(0.85);
    }
  }
}

// ----------------- HTML LEGEND CLICKS -----------------

function setupLegendClicks() {
  const items = document.querySelectorAll(".legend-item");
  if (!items) return;

  items.forEach((item) => {
    const idx = parseInt(item.dataset.index, 10);
    item.addEventListener("click", () => {
      userStartAudioIfNeeded();
      applyMood(idx);
    });
  });
}

function updateLegendActive() {
  const items = document.querySelectorAll(".legend-item");
  if (!items) return;

  items.forEach((item) => item.classList.remove("active"));

  const active = document.querySelector(
    `.legend-item[data-index="${currentMoodIndex}"]`
  );
  if (active) active.classList.add("active");
}

// ----------------- INPUT: MOUSE + KEYS -----------------

function mousePressed() {
  userStartAudioIfNeeded();

  // right click = next mood
  if (mouseButton === RIGHT) {
    nextMood();
    return false;
  }
  // left click can just be "start audio" and keep current mood
}

function keyPressed() {
  userStartAudioIfNeeded();

  // 1–7 go directly to moods
  if (key === "1") applyMood(0);
  else if (key === "2") applyMood(1);
  else if (key === "3") applyMood(2);
  else if (key === "4") applyMood(3);
  else if (key === "5") applyMood(4);
  else if (key === "6") applyMood(5);
  else if (key === "7") applyMood(6);
}

// ----------------- UNITY SYNC -----------------

// Send current mood name to the Unity iframe in real time
function syncMoodToUnity(moodName) {
  const frame = document.getElementById("unity-frame");
  if (!frame || !frame.contentWindow) return;

  frame.contentWindow.postMessage(
    { type: "setMood", mood: moodName },
    "*"
  );
}
