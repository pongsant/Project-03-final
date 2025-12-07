// DREAM ORB VISUALIZER – PLAYLIST VERSION
// 7 moods, each mood can have multiple songs.
// Visual: glowing orb, particles, soft gradient background.

// ---------- GLOBALS ----------

let scenes;
let currentSceneIndex = 0;

// layout
let baseRadius;

// animation targets
let sizeTarget, wobbleTarget;
let currentSize, currentWobble;

// background gradient
let currentBgTop, currentBgBottom;
let bgTopTarget, bgBottomTarget;

// base background gradient colors
const baseBgTop = "#fc8b1b";   // orange
const baseBgBottom = "#1c2efd"; // blue

// sound: tracks[moodIndex][trackIndex]
let tracks = [];
let amplitude;
let currentTrack = null;
let currentTrackIndex = 0;

// particles
let particles = [];

// ---------- SETUP ----------

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);

  baseRadius = min(windowWidth, windowHeight) * 0.18;

  // prevent right-click menu
  document.addEventListener("contextmenu", (e) => e.preventDefault());

  // 7 moods – each with playlist (you can add more files later)
  scenes = [
    {
      name: "Calm",
      tagline: "soft blue, quiet breathing",
      orbColor: "#167ef4",
      lightColor: "#76b0ff",
      haloColor: "#ffffff",
      sizeTarget: 1.0,
      wobbleTarget: 0.025,
      movementType: "float",
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
      haloColor: "#fff2bf",
      sizeTarget: 1.15,
      wobbleTarget: 0.035,
      movementType: "wave",
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
      haloColor: "#ffe0ec",
      sizeTarget: 1.1,
      wobbleTarget: 0.03,
      movementType: "float",
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
      haloColor: "#efe6ff",
      sizeTarget: 0.95,
      wobbleTarget: 0.04,
      movementType: "pulse",
      audioFiles: [
        "dream.mp3",
      ]
    },
    {
      name: "Hope",
      tagline: "mint air, quiet growth",
      orbColor: "#8af9b7",
      lightColor: "#b6ffd3",
      haloColor: "#e5fff3",
      sizeTarget: 1.05,
      wobbleTarget: 0.03,
      movementType: "wave",
      audioFiles: [
        "hope.mp3",
      ]
    },
    {
      name: "Nostalgia",
      tagline: "peach glow, far memories",
      orbColor: "#f88842",
      lightColor: "#ffb06e",
      haloColor: "#ffe0c7",
      sizeTarget: 0.9,
      wobbleTarget: 0.025,
      movementType: "float",
      audioFiles: [
        "nostalgia.mp3",
      ]
    },
    {
      name: "Alone",
      tagline: "blue-violet, soft sadness",
      orbColor: "#3b4bfa",
      lightColor: "#8b97ff",
      haloColor: "#e4e6ff",
      sizeTarget: 0.85,
      wobbleTarget: 0.05,
      movementType: "pulse",
      audioFiles: [
        "alone.mp3",
      ]
    }
  ];

  // starting values from first scene (visual only – no sound yet)
  const s = scenes[currentSceneIndex];
  currentSize = s.sizeTarget;
  currentWobble = s.wobbleTarget;

  currentBgTop = color(baseBgTop);
  currentBgBottom = color(baseBgBottom);
  bgTopTarget = makeBgTopForScene(s);
  bgBottomTarget = makeBgBottomForScene(s);

  sizeTarget = s.sizeTarget;
  wobbleTarget = s.wobbleTarget;

  // amplitude analyzer
  amplitude = new p5.Amplitude();
  amplitude.smooth(0.8);

  // load audio for each mood and each track
  tracks = [];
  for (let i = 0; i < scenes.length; i++) {
    tracks[i] = [];
    for (let j = 0; j < scenes[i].audioFiles.length; j++) {
      const filePath = scenes[i].audioFiles[j]; // files in same folder as sketch.js
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

  initParticles();
  setupLegendClicks();
  noStroke();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  baseRadius = min(windowWidth, windowHeight) * 0.18;
}

// ---------- BACKGROUND HELPERS ----------

function makeBgTopForScene(scene) {
  const baseTopCol = color(baseBgTop);
  const orbCol = color(scene.orbColor);
  return lerpColor(baseTopCol, orbCol, 0.45);
}

function makeBgBottomForScene(scene) {
  const baseBottomCol = color(baseBgBottom);
  const orbCol = color(scene.orbColor);
  return lerpColor(baseBottomCol, orbCol, 0.35);
}

// ---------- PARTICLES ----------

function initParticles() {
  particles = [];
  const count = 70;
  for (let i = 0; i < count; i++) {
    particles.push({
      angle: random(TWO_PI),
      radius: baseRadius * random(1.3, 2.0),
      speed: random(0.002, 0.006),
      offset: random(1000),
      size: random(3, 7)
    });
  }
}

function drawParticles(scene, levelBoost) {
  const t = millis() * 0.001;
  const c = color(scene.lightColor);

  push();
  for (let p of particles) {
    p.angle += p.speed * (1 + levelBoost * 0.4);
    let pulsate = 0.06 * sin(t * 1.4 + p.offset + levelBoost * 2.0);
    let r = p.radius * (1 + pulsate);

    let x = cos(p.angle) * r;
    let y = sin(p.angle) * r * 0.6;

    push();
    translate(x, y, -baseRadius * 0.3);
    ambientMaterial(red(c), green(c), blue(c), 140);
    sphere(p.size * 0.35, 6, 6);
    pop();
  }
  pop();
}

// ---------- BACKGROUND GRADIENT ----------

function drawAnimatedBackground(levelBoost) {
  resetMatrix();
  noStroke();

  const t = millis() * 0.0005;

  currentBgTop = lerpColor(currentBgTop, bgTopTarget, 0.05);
  currentBgBottom = lerpColor(currentBgBottom, bgBottomTarget, 0.05);

  let bands = 120;
  let offset = sin(t * 2.0) * 20 * (0.3 + levelBoost * 0.2);

  for (let i = 0; i <= bands; i++) {
    let amt = i / bands;
    let c = lerpColor(currentBgTop, currentBgBottom, amt);
    fill(c);

    let y = -height / 2 + amt * height + offset;
    let h = height / bands + 1;
    rect(-width / 2, y, width, h);
  }
}

// ---------- DRAW LOOP ----------

function draw() {
  const scene = scenes[currentSceneIndex];

  let level = amplitude ? amplitude.getLevel() : 0;
  let levelBoost = constrain(map(level, 0, 0.3, 0, 1), 0, 1);

  currentSize = lerp(currentSize, sizeTarget, 0.08);
  currentWobble = lerp(currentWobble, wobbleTarget, 0.08);

  drawAnimatedBackground(levelBoost);

  resetMatrix();

  orbitControl(0.6, 0.6, 0.25);
  ambientLight(40);

  drawParticles(scene, levelBoost);
  drawOrb(scene, levelBoost);
  drawWaves(scene, levelBoost);
  drawHUD(scene);
}

// ---------- ORB ----------

function drawOrb(scene, levelBoost) {
  const t = millis() * 0.001;

  let breathing = 1 + 0.03 * sin(t * 1.5);
  breathing += levelBoost * 0.1;

  let wobble = currentWobble * (1 + levelBoost * 0.8);
  let wobbleOffsetY = sin(t * 2.0) * baseRadius * wobble;

  let offsetX = 0;
  let offsetZ = 0;

  if (scene.movementType === "wave") {
    offsetX = sin(t * 1.4) * baseRadius * 0.18 * (1 + levelBoost * 0.5);
  } else if (scene.movementType === "pulse") {
    offsetZ = cos(t * 1.3) * baseRadius * 0.14 * levelBoost;
  }

  push();
  translate(offsetX, wobbleOffsetY, offsetZ);

  noStroke();

  let outerR = baseRadius * currentSize * breathing;
  let innerR = outerR * 0.55;

  let orbCol = color(scene.orbColor);
  let lightCol = color(scene.lightColor);
  let haloC = color(scene.haloColor);

  // halo
  push();
  let haloScale = 1.35 + levelBoost * 0.18;
  emissiveMaterial(
    red(haloC) * 0.9,
    green(haloC) * 0.9,
    blue(haloC) * 0.9
  );
  sphere(outerR * haloScale, 40, 40);
  pop();

  // outer shell
  push();
  emissiveMaterial(
    red(orbCol) * 1.1,
    green(orbCol) * 1.1,
    blue(orbCol) * 1.1
  );
  sphere(outerR, 96, 96);
  pop();

  // inner core
  push();
  let core = lerpColor(orbCol, lightCol, 0.7);
  emissiveMaterial(
    red(core) * (1.3 + levelBoost * 0.4),
    green(core) * (1.3 + levelBoost * 0.4),
    blue(core) * (1.3 + levelBoost * 0.4)
  );
  sphere(innerR, 64, 64);
  pop();

  pop();
}

// ---------- WAVES UNDER ORB ----------

function drawWaves(scene, levelBoost) {
  const t = millis() * 0.001;
  let lc = color(scene.lightColor);

  resetMatrix();
  noFill();
  strokeWeight(1.2);

  for (let i = 0; i < 4; i++) {
    let phase = t * 1.4 + i * 0.7;
    let base = baseRadius * (1.1 + i * 0.35);
    let r = base + sin(phase) * baseRadius * 0.08 * (1 + levelBoost * 0.7);
    let alpha = 70 + 40 * (1 - i * 0.22) + levelBoost * 30;

    stroke(
      red(lc),
      green(lc),
      blue(lc),
      alpha
    );

    push();
    translate(0, baseRadius * 1.65, 0);
    ellipse(0, 0, r * 2.1, r * 1.3);
    pop();
  }
}

// ---------- HUD ----------

function drawHUD(scene) {
  resetMatrix();
  translate(-width / 2, -height / 2, 0);

  noStroke();
  textAlign(LEFT, BOTTOM);

  fill(30);
  textSize(16);
  text(scene.name, 24, height - 72);

  textSize(12);
  fill(60);
  text(scene.tagline, 24, height - 52);

  const mi = currentSceneIndex;
  const totalTracks = tracks[mi] ? tracks[mi].length : 0;
  if (totalTracks > 0) {
    fill(80);
    textSize(11);
    text(
      "Track " + (currentTrackIndex + 1) + " / " + totalTracks,
      24,
      height - 36
    );
  }

  textSize(11);
  fill(90);
  text(
    "Left-drag: orbit · Right-click / 1–7: change mood · , / .: prev/next song · Space: pause/play",
    24,
    height - 18
  );
}

// ---------- INTERACTION: MOOD + TRACK ----------

function setScene(index) {
  currentSceneIndex = (index + scenes.length) % scenes.length;
  const s = scenes[currentSceneIndex];

  sizeTarget = s.sizeTarget;
  wobbleTarget = s.wobbleTarget;

  bgTopTarget = makeBgTopForScene(s);
  bgBottomTarget = makeBgBottomForScene(s);

  currentTrackIndex = 0; // reset playlist for new mood
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

function nextTrack() {
  const mi = currentSceneIndex;
  const moodTracks = tracks[mi];
  const totalTracks = moodTracks ? moodTracks.length : 0;
  if (!totalTracks) return;

  currentTrackIndex = (currentTrackIndex + 1) % totalTracks;
  switchAudioToCurrentScene();
}

function prevTrack() {
  const mi = currentSceneIndex;
  const moodTracks = tracks[mi];
  const totalTracks = moodTracks ? moodTracks.length : 0;
  if (!totalTracks) return;

  currentTrackIndex = (currentTrackIndex - 1 + totalTracks) % totalTracks;
  switchAudioToCurrentScene();
}

// ---------- LEGEND CLICKS ----------

function setupLegendClicks() {
  const items = document.querySelectorAll(".legend-item");
  items.forEach((item) => {
    const idx = parseInt(item.dataset.index, 10);
    item.addEventListener("click", () => {
      userStartAudio();
      setScene(idx);
    });
  });
  updateLegendActive(); // highlight initial scene
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

function mousePressed() {
  userStartAudio();

  if (mouseButton === RIGHT) {
    setScene(currentSceneIndex + 1);
  }
}

function keyPressed() {
  userStartAudio();

  if (key === "1") setScene(0);
  else if (key === "2") setScene(1);
  else if (key === "3") setScene(2);
  else if (key === "4") setScene(3);
  else if (key === "5") setScene(4);
  else if (key === "6") setScene(5);
  else if (key === "7") setScene(6);
  else if (key === " ") togglePlayPause();
  else if (key === ",") prevTrack();
  else if (key === ".") nextTrack();
}

function togglePlayPause() {
  if (!currentTrack) {
    // if no track yet but user hits space, start current mood from beginning
    switchAudioToCurrentScene();
    return;
  }

  if (currentTrack.isPlaying()) currentTrack.pause();
  else currentTrack.play();
}
