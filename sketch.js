// JELLY ORB – BRIGHT 3D MUSIC VISUALIZER (WEBGL)
//
// Controls:
//  - Left drag: orbit around orb
//  - Scroll: zoom
//  - Right click: next mood
//  - 1–7: pick mood
//  - Space: play / pause
//  - C / Z / X: tracks 1 / 2 / 3 in current mood
//  - Click legend item (HTML .legend-item) to change mood

// ---------- GLOBALS ----------

let scenes;
let currentSceneIndex = 0;

let baseRadius;

// sound: tracks[moodIndex][trackIndex]
let tracks = [];
let amplitude;
let currentTrack = null;
let currentTrackIndex = 0;

// bright pastel background
let bgTopCurrent, bgBottomCurrent;
let bgTopTarget, bgBottomTarget;

// ---------- SETUP ----------

function setup() {
  const cnv = createCanvas(windowWidth, windowHeight, WEBGL);
  pixelDensity(1);

  // disable default right-click menu on the canvas
  cnv.elt.oncontextmenu = () => false;

  baseRadius = min(windowWidth, windowHeight) * 0.22;

  // moods
  scenes = [
    {
      name: "Calm",
      tagline: "soft blue, quiet breathing",
      orbColor: "#70a4ff",
      lightColor: "#cfe0ff",
      audioFiles: ["calm.mp3"]
    },
    {
      name: "Happy",
      tagline: "warm yellow, gentle joy",
      orbColor: "#ffd75a",
      lightColor: "#fff2b8",
      audioFiles: ["happy.mp3"]
    },
    {
      name: "Love",
      tagline: "soft pink glow",
      orbColor: "#ff82b2",
      lightColor: "#ffc7dc",
      audioFiles: ["love.mp3"]
    },
    {
      name: "Dream",
      tagline: "lavender haze, drifting",
      orbColor: "#c8a4ff",
      lightColor: "#e8d7ff",
      audioFiles: ["dream.mp3"]
    },
    {
      name: "Hope",
      tagline: "fresh mint, quiet growth",
      orbColor: "#8fffd1",
      lightColor: "#caffec",
      audioFiles: ["hope.mp3"]
    },
    {
      name: "Nostalgia",
      tagline: "peach glow, far memories",
      orbColor: "#ffb27a",
      lightColor: "#ffd7bb",
      audioFiles: ["nostalgia.mp3"]
    },
    {
      name: "Alone",
      tagline: "blue-violet, soft sadness",
      orbColor: "#7a8bff",
      lightColor: "#c8cdff",
      audioFiles: ["alone.mp3"]
    }
  ];

  // background starting + target colors (bright pastel)
  bgTopCurrent = color("#f7f2ff");
  bgBottomCurrent = color("#e3efff");

  const s = scenes[currentSceneIndex];
  bgTopTarget = color(s.lightColor);
  bgBottomTarget = lerpColor(color(s.orbColor), color("#ffffff"), 0.6);

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
  cursor(ARROW);
  textFont("Space Grotesk, system-ui, sans-serif");
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight, WEBGL);
  baseRadius = min(windowWidth, windowHeight) * 0.22;
}

// ---------- BACKGROUND (BRIGHT + GLOW WAVES) ----------

function drawBrightBackground(levelBoost) {
  push();
  resetMatrix();
  translate(-width / 2, -height / 2);

  // lerp towards target colors
  bgTopCurrent = lerpColor(bgTopCurrent, bgTopTarget, 0.04);
  bgBottomCurrent = lerpColor(bgBottomCurrent, bgBottomTarget, 0.04);

  let steps = 140;
  let t = millis() * 0.0015;

  noStroke();
  for (let i = 0; i < steps; i++) {
    let amt = i / (steps - 1);
    let c = lerpColor(bgTopCurrent, bgBottomCurrent, amt);

    // subtle shimmer like your first code
    let pulse = sin(amt * PI * 3 + t) * 18 * levelBoost;
    let r = red(c) + pulse;
    let g = green(c) + pulse * 0.7;
    let b = blue(c) + pulse * 0.5;

    fill(constrain(r, 0, 255), constrain(g, 0, 255), constrain(b, 0, 255));
    let y = (i / steps) * height;
    rect(0, y, width, height / steps + 3);
  }

  pop();
}

// ---------- MAIN DRAW ----------

function draw() {
  if (!scenes) return;

  const scene = scenes[currentSceneIndex];

  let level = amplitude ? amplitude.getLevel() : 0;
  let levelBoost = constrain(map(level, 0, 0.3, 0, 1), 0, 1);

  // background
  drawBrightBackground(levelBoost);

  // 3D orb
  push();
  orbitControl(0.7, 0.7, 0.3);
  drawEnergyOrb(scene, levelBoost);
  pop();

  // HUD
  drawHUD(scene);
}

// ---------- JELLY ORB WITH SOFT SHADOW ----------

function drawEnergyOrb(scene, levelBoost) {
  const t = millis() * 0.001;

  let orbCol = color(scene.orbColor);
  let lightCol = color(scene.lightColor);

  let baseR = baseRadius;

  // how much the surface deforms (0 = perfect sphere, 1 = very blobby)
  let deformAmount = map(levelBoost, 0, 1, 0.03, 0.25);
  deformAmount = constrain(deformAmount, 0.03, 0.25);

  // global jelly squash & stretch (soft wobble)
  let squashY = 1.0 + 0.18 * levelBoost * sin(t * 2.0);
  let squashX = 1.0 - 0.10 * levelBoost * sin(t * 2.0 + 1.2);
  let squashZ = 1.0 - 0.10 * levelBoost * sin(t * 2.0 - 0.6);

  push();

  // --- SOFT SHADOW UNDER ORB (3D cue) ---
  push();
  blendMode(BLEND);
  noStroke();

  // light colored shadow based on orb color
  let shadowCol = lerpColor(color(0, 0, 0, 0), orbCol, 0.2);
  shadowCol.setAlpha(80 + levelBoost * 40);

  translate(0, baseR * 1.3, 0); // below orb
  rotateX(HALF_PI);            // lay flat
  fill(shadowCol);
  ellipse(0, 0, baseR * 2.2, baseR * 1.4);
  pop();

  // --- ORB ITSELF ---
  blendMode(ADD);

  // slow rotation so it always feels alive
  rotateY(t * 0.28);
  rotateX(sin(t * 0.5) * 0.35);

  // jelly squash
  scale(squashX, squashY, squashZ);

  // aura
  noStroke();
  let auraCol = lerpColor(lightCol, orbCol, 0.45);
  auraCol.setAlpha(45 + levelBoost * 55);
  fill(auraCol);
  sphere(baseR * 1.4, 32, 24);

  // jelly surface: soft noise-deformed sphere
  let latSteps = 34;
  let lonSteps = 68;
  let noiseScale = 1.3;
  let flowSpeed = 0.8;

  for (let i = 0; i <= latSteps; i++) {
    let v = i / latSteps;
    let theta = v * PI; // 0..PI

    for (let j = 0; j < lonSteps; j++) {
      let u = j / lonSteps;
      let phi = u * TWO_PI;

      let sx = sin(theta) * cos(phi);
      let sy = cos(theta);
      let sz = sin(theta) * sin(phi);

      let n = noise(
        sx * noiseScale + 10.0,
        sy * noiseScale + 20.0,
        sz * noiseScale + 30.0 + t * flowSpeed
      );

      // center noise and use deformAmount
      let offset = (n - 0.5) * 2.0 * deformAmount;
      let r = baseR * (1.0 + offset);

      let px = sx * r;
      let py = sy * r;
      let pz = sz * r;

      // color: soft mix of light + orb color
      let colMix = 0.35 + n * 0.65;
      let c = lerpColor(lightCol, orbCol, colMix);
      let alpha = 160 + levelBoost * 90 - v * 45;
      c.setAlpha(constrain(alpha, 50, 255));

      stroke(c);
      let w = 2.0 - v * 0.9;
      w *= 1.0 + levelBoost * 0.6;
      strokeWeight(max(0.7, w));
      point(px, py, pz);
    }
  }

  // inner core (round & soft)
  noStroke();
  let coreCol = lerpColor(lightCol, color("#ffffff"), 0.55);
  coreCol.setAlpha(230);
  fill(coreCol);
  sphere(baseR * 0.45, 36, 28);

  // tiny bright heart
  let heartCol = color(255);
  heartCol.setAlpha(255);
  fill(heartCol);
  sphere(baseR * 0.2, 24, 18);

  blendMode(BLEND);
  pop();
}

// ---------- HUD / TEXT ----------

function drawHUD(scene) {
  push();
  resetMatrix();
  translate(-width / 2, -height / 2);

  textAlign(LEFT, TOP);

  // title
  fill(25, 25, 35, 220);
  textSize(20);
  text(scene.name, 24, 24);

  // tagline
  fill(40, 40, 60, 210);
  textSize(13);
  text(scene.tagline, 24, 48);

  // instructions (bottom-left)
  let yBase = height - 70;
  textSize(11);
  fill(50, 50, 70, 200);
  text(
    "Left drag: orbit · Scroll: zoom · Right click: next mood · 1–7: mood · Space: play/pause · C/Z/X: tracks",
    24,
    yBase
  );

  // track info
  const moodTracks = tracks[currentSceneIndex];
  if (moodTracks && moodTracks.length > 0) {
    text(
      "Track " + (currentTrackIndex + 1) + " / " + moodTracks.length,
      24,
      yBase + 16
    );
  }

  pop();
}

// ---------- MOOD / AUDIO HELPERS ----------

function setScene(index) {
  currentSceneIndex = (index + scenes.length) % scenes.length;
  const s = scenes[currentSceneIndex];

  bgTopTarget = color(s.lightColor);
  bgBottomTarget = lerpColor(color(s.orbColor), color("#ffffff"), 0.6);

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

// choose track index in current mood (0,1,2)
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
  if (!items) return;

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
  if (!items) return;

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
    if (!currentTrack) {
      switchAudioToCurrentScene();
    } else {
      if (currentTrack.isPlaying()) currentTrack.pause();
      else currentTrack.play();
    }
  }

  // track selection in current mood
  else if (key === "c" || key === "C") {
    jumpToTrackInCurrentMood(0);
  } else if (key === "z" || key === "Z") {
    jumpToTrackInCurrentMood(1);
  } else if (key === "x" || key === "X") {
    jumpToTrackInCurrentMood(2);
  }
}

// right click = next mood
function mousePressed() {
  userStartAudio();

  if (mouseButton === RIGHT) {
    setScene(currentSceneIndex + 1);
  }
}
