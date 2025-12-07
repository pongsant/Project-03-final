// 3D DREAM ORB – MUSIC REACTIVE VERSION
// Uses only audio/track1.mp3 for all 3 moods

let scenes;
let currentSceneIndex = 0;

// layout
let baseRadius;

// animation targets
let sizeTarget, wobbleTarget;
let currentSize, currentWobble;
let currentBg, bgTarget;

// sound
let tracks = [];
let amplitude;
let currentTrack = null;

// particles
let particles = [];

// ---------------- PRELOAD ----------------
function preload() {
  // You only have audio/track1.mp3, so we reuse it for all moods
  let s = loadSound("audio/track1.mp3");
  tracks[0] = s;
  tracks[1] = s;
  tracks[2] = s;
}

// ---------------- SETUP ----------------
function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);

  baseRadius = min(windowWidth, windowHeight) * 0.18;

  // prevent right-click menu so we can use RIGHT mouse button
  document.addEventListener("contextmenu", (e) => e.preventDefault());

  // define moods / scenes
  scenes = [
    {
      name: "Sunrise",
      tagline: "calm, warm, healing",
      orbColor: "#ffe5f5",
      lightColor: "#ffcf80",
      bgColor: "#ffb7c9",
      sizeTarget: 1.0,
      wobbleTarget: 0.03,
      movementType: "float", // gentle up/down
      audioIndex: 0
    },
    {
      name: "Tide",
      tagline: "movement, change, flow",
      orbColor: "#ffd6b3",
      lightColor: "#9fe8ff",
      bgColor: "#f28ac5",
      sizeTarget: 1.2,
      wobbleTarget: 0.05,
      movementType: "wave", // side-to-side sway
      audioIndex: 1
    },
    {
      name: "Starlight",
      tagline: "distance, memory, dream",
      orbColor: "#d4c3ff",
      lightColor: "#88f7ff",
      bgColor: "#1a1033",
      sizeTarget: 0.9,
      wobbleTarget: 0.07,
      movementType: "pulse", // rotation / depth pulse
      audioIndex: 2
    }
  ];

  // starting values based on first scene
  const s = scenes[currentSceneIndex];
  currentSize = s.sizeTarget;
  currentWobble = s.wobbleTarget;
  currentBg = color(s.bgColor);
  sizeTarget = s.sizeTarget;
  wobbleTarget = s.wobbleTarget;
  bgTarget = color(s.bgColor);

  // amplitude analyzer for music
  amplitude = new p5.Amplitude();
  amplitude.smooth(0.8);

  initParticles();

  noStroke();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  baseRadius = min(windowWidth, windowHeight) * 0.18;
}

// ---------------- PARTICLES ----------------
function initParticles() {
  particles = [];
  const count = 80;
  for (let i = 0; i < count; i++) {
    particles.push({
      angle: random(TWO_PI),
      radius: baseRadius * random(1.4, 2.0),
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
    p.angle += p.speed * (1 + levelBoost * 0.8);
    let pulsate = 0.1 * sin(t * 1.8 + p.offset + levelBoost * 3.0);
    let r = p.radius * (1 + pulsate * (1 + levelBoost));

    let x = cos(p.angle) * r;
    let y = sin(p.angle) * r * 0.6;

    push();
    translate(x, y, 0);
    let alpha = 100 + 120 * levelBoost;
    ambientMaterial(red(c), green(c), blue(c), alpha);
    sphere(p.size * 0.3, 6, 6);
    pop();
  }
  pop();
}

// ---------------- DRAW ----------------
function draw() {
  const scene = scenes[currentSceneIndex];

  // audio level (react to music)
  let level = amplitude ? amplitude.getLevel() : 0;
  let levelBoost = constrain(map(level, 0, 0.3, 0, 1), 0, 1);

  // smooth transitions
  currentSize = lerp(currentSize, sizeTarget, 0.08);
  currentWobble = lerp(currentWobble, wobbleTarget, 0.08);
  currentBg = lerpColor(currentBg, bgTarget, 0.06);

  background(currentBg);

  // camera control: left-drag to orbit, scroll to zoom
  orbitControl(0.6, 0.6, 0.2);

  // lights
  ambientLight(35);
  const lc = color(scene.lightColor);
  const t = millis() * 0.001;
  let lightX = 300 * sin(t * 0.6);
  let lightY = -200 + 80 * sin(t * 0.9);
  let lightZ = 300 * cos(t * 0.6);
  pointLight(red(lc), green(lc), blue(lc), lightX, lightY, lightZ);
  directionalLight(80, 80, 120, -0.3, -0.6, -0.4);

  // particles
  drawParticles(scene, levelBoost);

  // orb
  drawOrb(scene, levelBoost);

  // HUD
  drawHUD(scene);
}

function drawOrb(scene, levelBoost) {
  const t = millis() * 0.001;

  // base breathing
  let breathing = 1 + 0.03 * sin(t * 1.5);
  // audio-reactive breathing
  breathing += levelBoost * 0.15;

  // wobble with audio intensity
  let wobble = currentWobble * (1 + levelBoost * 1.2);
  let wobbleOffsetY = sin(t * 2.0) * baseRadius * wobble;

  let offsetX = 0;
  let offsetZ = 0;
  let rotY = 0;

  if (scene.movementType === "float") {
    // gentle up/down (already handled by wobble)
  } else if (scene.movementType === "wave") {
    // side-to-side sway
    offsetX = sin(t * 1.6) * baseRadius * 0.2 * (1 + levelBoost);
  } else if (scene.movementType === "pulse") {
    // rotation + depth pulses
    rotY = sin(t * 1.8) * 0.4 * (1 + levelBoost);
    offsetZ = cos(t * 1.3) * baseRadius * 0.15 * levelBoost;
  }

  push();
  translate(offsetX, wobbleOffsetY, offsetZ);
  rotateY(rotY);

  let oc = color(scene.orbColor);
  ambientMaterial(red(oc), green(oc), blue(oc), 255);
  emissiveMaterial(
    red(oc) * (0.3 + levelBoost * 0.4),
    green(oc) * (0.3 + levelBoost * 0.4),
    blue(oc) * (0.4 + levelBoost * 0.5)
  );

  sphere(baseRadius * currentSize * breathing, 80, 80);
  pop();
}

function drawHUD(scene) {
  resetMatrix();
  translate(-width / 2, -height / 2, 0);

  noStroke();
  fill(255);
  textAlign(LEFT, BOTTOM);
  textSize(16);
  text(scene.name, 24, height - 44);

  textSize(12);
  fill(230);
  text(scene.tagline, 24, height - 26);

  textSize(11);
  fill(210);
  text(
    "Left-drag: orbit • Right-click / 1 / 2 / 3: change mood • Space: pause/play",
    24,
    height - 10
  );
}

// ---------------- INTERACTION ----------------
function setScene(index) {
  currentSceneIndex = (index + scenes.length) % scenes.length;
  const s = scenes[currentSceneIndex];

  sizeTarget = s.sizeTarget;
  wobbleTarget = s.wobbleTarget;
  bgTarget = color(s.bgColor);

  switchAudioToCurrentScene();
}

function mousePressed() {
  // needed for browser audio policies
  userStartAudio();

  if (mouseButton === RIGHT) {
    setScene(currentSceneIndex + 1);
  }
}

function keyPressed() {
  userStartAudio();

  if (key === "1") {
    setScene(0);
  } else if (key === "2") {
    setScene(1);
  } else if (key === "3") {
    setScene(2);
  } else if (key === " ") {
    togglePlayPause();
  }
}

function switchAudioToCurrentScene() {
  const scene = scenes[currentSceneIndex];
  const idx = scene.audioIndex;

  // stop previous track if it exists
  if (currentTrack && currentTrack.isPlaying()) {
    currentTrack.stop();
  }

  currentTrack = tracks[idx];

  if (currentTrack) {
    currentTrack.loop();
    amplitude.setInput(currentTrack);
  }
}

function togglePlayPause() {
  if (!currentTrack) return;
  if (currentTrack.isPlaying()) {
    currentTrack.pause();
  } else {
    currentTrack.play();
  }
}
