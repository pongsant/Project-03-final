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

let scenes;
let currentSceneIndex = 0;

let baseRadius;

// sound: tracks[moodIndex][trackIndex]
let tracks = [];
let amplitude;
let fft;
let currentTrack = null;
let currentTrackIndex = 0;

// background colors
let bgTopCurrent, bgBottomCurrent;
let bgTopTarget, bgBottomTarget;

// smoothed chaos so animation is not stressful
let chaosSmoothed = 0.1;

// “beat” and “vibe” smoothing
let beatSmoothed = 0;  // small accents from drums
let vibeSmoothed = 0;  // main smooth movement from song

// ---------- SETUP ----------

function setup() {
  const cnv = createCanvas(windowWidth, windowHeight, WEBGL);
  pixelDensity(1);

  // disable default right-click menu on the canvas
  cnv.elt.oncontextmenu = () => false;

  // smaller orb
  baseRadius = min(windowWidth, windowHeight) * 0.18;

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

  // amplitude analyzer (smooth)
  amplitude = new p5.Amplitude();
  amplitude.smooth(0.9);

  // FFT for spectrum (vibe + light beat detection)
  fft = new p5.FFT(0.8, 1024);

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
  baseRadius = min(windowWidth, windowHeight) * 0.18;
}

// ---------- SIMPLE BRIGHT BACKGROUND (OLD VERSION STYLE) ----------

function drawBrightBackground(levelBoost) {
  push();
  resetMatrix();
  translate(-width / 2, -height / 2);

  // lerp towards target colors
  bgTopCurrent = lerpColor(bgTopCurrent, bgTopTarget, 0.04);
  bgBottomCurrent = lerpColor(bgBottomCurrent, bgBottomTarget, 0.04);

  let steps = 140;
  let t = millis() * 0.0009; // slow shimmer

  noStroke();
  for (let i = 0; i < steps; i++) {
    let amt = i / (steps - 1);
    let c = lerpColor(bgTopCurrent, bgBottomCurrent, amt);

    // subtle shimmer
    let pulse = sin(amt * PI * 2.0 + t * 4.0) * 6 * levelBoost;
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

  // overall loudness
  let level = amplitude ? amplitude.getLevel() : 0;
  let levelBoost = constrain(map(level, 0, 0.3, 0, 1), 0, 1);

  // spectrum
  let spectrum = fft.analyze();

  // low = drums, mid/high = vibe / harmony / brightness
  let lowEnergy = fft.getEnergy(40, 180);      // kick-ish
  let midEnergy = fft.getEnergy(200, 2000);    // body of song
  let highEnergy = fft.getEnergy(2000, 8000);  // air / brightness

  // light beat (small effect)
  let rawBeat = max(lowEnergy, midEnergy) / 255.0;
  rawBeat = constrain((rawBeat - 0.3) * 1.7, 0, 1);
  beatSmoothed = lerp(beatSmoothed, rawBeat, 0.2);
  let beatPulse = beatSmoothed;

  // vibe = main driver (mid + high)
  let rawVibe = (midEnergy * 0.6 + highEnergy * 0.4) / 255.0;
  rawVibe = constrain(rawVibe, 0, 1);
  vibeSmoothed = lerp(vibeSmoothed, rawVibe, 0.15);
  let vibe = vibeSmoothed;

  // chaosTarget = mostly level + vibe, plus small beat spice
  let chaosTarget =
    constrain(map(level, 0, 0.3, 0.05, 0.55), 0.05, 0.55) +
    vibe * 0.35 +
    beatPulse * 0.15;
  chaosTarget = constrain(chaosTarget, 0.05, 0.85);

  chaosSmoothed = lerp(chaosSmoothed, chaosTarget, 0.06);
  let chaos = chaosSmoothed;

  // SIMPLE background (old style)
  drawBrightBackground(levelBoost);

  // 3D orb / blob
  push();
  orbitControl(0.7, 0.7, 0.3);
  drawEnergyOrb(scene, levelBoost, chaos, vibe, beatPulse);
  pop();

  // HUD
  drawHUD(scene, chaos, level, vibe, beatPulse);
}

// ---------- ORB – VIBE-REACTIVE SMOOTH BLOB ----------

function drawEnergyOrb(scene, levelBoost, chaos, vibe, beatPulse) {
  const t = millis() * 0.001;

  let orbCol = color(scene.orbColor);
  let lightCol = color(scene.lightColor);

  let baseR = baseRadius;

  // deformation amount – soft but expressive
  let deformAmount = map(chaos, 0.05, 0.85, 0.01, 0.24);

  // breathing squash:
  //   vibe = smooth breathing
  //   beat = tiny quick flick
  let breatheBase = sin(t * (0.7 + vibe * 0.9)) * 0.18 * (0.3 + chaos);
  let drumBreathe = beatPulse * 0.15;
  let breathe = breatheBase + drumBreathe;

  let squashY = 1.0 + breathe;
  let squashX = 1.0 - breathe * 0.45;
  let squashZ = 1.0 - breathe * 0.5;

  push();

  // ---------- ORIENTATION RINGS (FOLLOW VIBE) ----------
  push();
  blendMode(ADD);
  noFill();

  let ringBase = lerpColor(color(255), orbCol, 0.5);
  let ringAlpha = 55 + 70 * vibe + 35 * levelBoost + 30 * beatPulse;
  ringBase.setAlpha(ringAlpha);
  stroke(ringBase);

  let ringThickness = baseR * (0.018 + vibe * 0.02);
  strokeWeight(1.2 + vibe * 0.8);

  // equator ring
  torus(baseR * (0.95 + vibe * 0.08), ringThickness, 60, 16);

  // tilted ring 1
  rotateX(PI / 3);
  torus(baseR * (0.85 + vibe * 0.06), ringThickness * 0.9, 60, 16);

  // tilted ring 2
  rotateY(PI / 3);
  torus(baseR * (0.8 + vibe * 0.04), ringThickness * 0.85, 60, 16);

  blendMode(BLEND);
  pop();

  // ---------- ORB BODY / BLOB ----------

  blendMode(ADD);

  // rotation:
  //   vibe = main rotation speed
  //   beat = small twist
  let drumTwist = beatPulse * 0.25;
  rotateY(t * (0.12 + vibe * 0.25) + drumTwist * 0.3);
  rotateX(sin(t * (0.25 + vibe * 0.4)) * 0.28 + drumTwist * 0.2);

  scale(squashX, squashY, squashZ);

  // outer halo, mood-colored
  noStroke();
  let haloCol = lerpColor(lightCol, orbCol, 0.35);
  haloCol.setAlpha(40 + levelBoost * 60 + vibe * 50 + beatPulse * 35);
  fill(haloCol);
  sphere(baseR * (1.2 + vibe * 0.12), 40, 32);

  // outer glass shell
  let shellCol = lerpColor(lightCol, color(255), 0.6);
  shellCol.setAlpha(120 + levelBoost * 60 + vibe * 40);
  fill(shellCol);
  sphere(baseR * 0.98, 40, 32);

  // ---- mood-based iridescent colors (changes with mood) ----
  let cA = lerpColor(lightCol, orbCol, 0.15);
  let cB = lerpColor(lightCol, orbCol, 0.7);
  let cC = lerpColor(orbCol, color(255), 0.35);

  // shapeless “surface” made of points
  let latSteps = 44;
  let lonSteps = 88;
  let noiseScale = 1.2;
  let flowSpeed = 0.35 + vibe * 0.7; // vibe = main flow speed

  for (let i = 0; i <= latSteps; i++) {
    let v = i / latSteps;
    let theta = v * PI;

    beginShape(POINTS);
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

      let drumOffset = beatPulse * 0.22;
      let offset = (n - 0.5) * 2.0 * deformAmount + drumOffset * (n - 0.3);
      let r = baseR * (1.0 + offset);

      let px = sx * r;
      let py = sy * r;
      let pz = sz * r;

      // color bands: vibe affects how much they move
      let band1 = sin(theta * (1.0 + vibe * 0.6) + t * 0.45);
      let band2 = sin(phi * (2.0 + vibe * 0.8) - t * 0.3);
      let mixAmt = (band1 * 0.4 + band2 * 0.6 + 2.0) * 0.25;
      mixAmt = constrain(mixAmt, 0, 1);

      let baseBand = lerpColor(cA, cB, mixAmt);
      let accentBand = lerpColor(cC, orbCol, 0.5);
      let col = lerpColor(baseBand, accentBand, 0.4 + 0.25 * n);

      let edgeFade = pow(sin(theta), 0.7);
      let alpha =
        (80 + 100 * chaos + 40 * vibe + 30 * beatPulse) * edgeFade;
      col.setAlpha(alpha);

      stroke(col);
      strokeWeight(0.8 + chaos * 0.4 + vibe * 0.3);
      vertex(px, py, pz);
    }
    endShape();
  }

  // inner luminous core
  noStroke();
  let coreCol = lerpColor(lightCol, color("#ffffff"), 0.7);
  coreCol.setAlpha(215 + vibe * 30);
  fill(coreCol);
  sphere(baseR * 0.5, 36, 28);

  // tiny highlight sun at bottom-right
  push();
  rotateY(0.55);
  rotateX(0.38);
  translate(0, baseR * 0.34, baseR * 0.12);
  let sunCol = color(255, 245, 230);
  sunCol.setAlpha(230 + beatPulse * 20);
  fill(sunCol);
  sphere(baseR * 0.17, 22, 16);
  pop();

  blendMode(BLEND);
  pop();
}

// ---------- HUD / TEXT ----------

function drawHUD(scene, chaos, level, vibe, beatPulse) {
  push();
  resetMatrix();
  translate(-width / 2, -height / 2);

  textAlign(LEFT, TOP);

  // title
  fill(25, 25, 35, 220);
  textSize(20);
  text(scene.name + " mood", 24, 24);

  // tagline
  fill(40, 40, 60, 210);
  textSize(13);
  text(scene.tagline, 24, 48);

  // info
  let yBase = height - 80;
  textSize(11);
  fill(50, 50, 70, 200);
  text(
    "Left drag: orbit · Scroll: zoom · Right click: next mood · 1–7: mood · Space: play/pause · C/Z/X: tracks",
    24,
    yBase
  );

  const moodTracks = tracks[currentSceneIndex];
  let trackInfo = "";
  if (moodTracks && moodTracks.length > 0) {
    trackInfo = "Track " + (currentTrackIndex + 1) + " / " + moodTracks.length;
  }

  text(
    trackInfo +
      "   |   Chaos: " +
      chaos.toFixed(2) +
      "   Level: " +
      level.toFixed(3) +
      "   Vibe: " +
      vibe.toFixed(2) +
      "   Beat: " +
      beatPulse.toFixed(2),
    24,
    yBase + 16
  );

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
    fft.setInput(currentTrack);
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

  // track selection in current mood (C/Z/X)
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
