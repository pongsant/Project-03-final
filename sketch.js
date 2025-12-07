// 3D DREAM ORB – 7 MOODS, 7 SONGS, MUSIC REACTIVE
// NO preload() → avoids "loading" screen

let scenes;
let currentSceneIndex = 0;

// layout
let baseRadius;

// animation targets
let sizeTarget, wobbleTarget;
let currentSize, currentWobble;
let currentBg, bgTarget;

// sound
let tracks = [];     // will hold 7 p5.SoundFile objects or null
let amplitude;
let currentTrack = null;

// particles
let particles = [];

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);

  baseRadius = min(windowWidth, windowHeight) * 0.18;

  // prevent right-click menu so we can use RIGHT mouse button
  document.addEventListener("contextmenu", (e) => e.preventDefault());

  // define 7 moods / scenes with calm Pantone-like colors + audio filenames
  scenes = [
    {
      name: "Calm",
      tagline: "soft blue, quiet breathing",
      orbColor: "#C8E3FF",
      lightColor: "#8FB8FF",
      bgColor: "#AFC9F2",
      sizeTarget: 1.0,
      wobbleTarget: 0.025,
      movementType: "float",
      audioFile: "calm.mp3"
    },
    {
      name: "Happy",
      tagline: "warm yellow, gentle joy",
      orbColor: "#FFE7A3",
      lightColor: "#FFD46B",
      bgColor: "#FFEDBD",
      sizeTarget: 1.15,
      wobbleTarget: 0.035,
      movementType: "wave",
      audioFile: "happy.mp3"
    },
    {
      name: "Love",
      tagline: "soft pink, slow glow",
      orbColor: "#FFC6D9",
      lightColor: "#FF9BBF",
      bgColor: "#FFDFEB",
      sizeTarget: 1.1,
      wobbleTarget: 0.03,
      movementType: "float",
      audioFile: "love.mp3"
    },
    {
      name: "Dream",
      tagline: "lavender haze, drifting",
      orbColor: "#DCCBFF",
      lightColor: "#B89CFF",
      bgColor: "#C8B5FF",
      sizeTarget: 0.95,
      wobbleTarget: 0.04,
      movementType: "pulse",
      audioFile: "dream.mp3"
    },
    {
      name: "Hope",
      tagline: "mint air, quiet growth",
      orbColor: "#C8F4D9",
      lightColor: "#9EE8BD",
      bgColor: "#B9EDD0",
      sizeTarget: 1.05,
      wobbleTarget: 0.03,
      movementType: "wave",
      audioFile: "hope.mp3"
    },
    {
      name: "Nostalgia",
      tagline: "peach glow, far memories",
      orbColor: "#FFD1B3",
      lightColor: "#FFAE80",
      bgColor: "#FFE1C9",
      sizeTarget: 0.9,
      wobbleTarget: 0.025,
      movementType: "float",
      audioFile: "nostalgia.mp3"
    },
    {
      name: "Alone",
      tagline: "blue-violet, soft sadness",
      orbColor: "#C0C4FF",
      lightColor: "#8A92FF",
      bgColor: "#939BCF",
      sizeTarget: 0.85,
      wobbleTarget: 0.05,
      movementType: "pulse",
      audioFile: "alone.mp3"
    }
  ];

  // start values from first scene
  const s = scenes[currentSceneIndex];
  currentSize = s.sizeTarget;
  currentWobble = s.wobbleTarget;
  currentBg = color(s.bgColor);
  sizeTarget = s.sizeTarget;
  wobbleTarget = s.wobbleTarget;
  bgTarget = color(s.bgColor);

  // amplitude analyzer
  amplitude = new p5.Amplitude();
  amplitude.smooth(0.8);

  // load audio for each mood (no preload, so sketch will still run even if some fail)
  for (let i = 0; i < scenes.length; i++) {
    const filePath = "audio/" + scenes[i].audioFile;
    loadSound(
      filePath,
      (snd) => {
        tracks[i] = snd;
        console.log("Loaded:", filePath);
      },
      (err) => {
        console.warn("Failed to load:", filePath);
        tracks[i] = null;
      }
    );
  }

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

  // audio level
  let level = amplitude ? amplitude.getLevel() : 0;
  let levelBoost = constrain(map(level, 0, 0.3, 0, 1), 0, 1);

  // smooth transitions
  currentSize = lerp(currentSize, sizeTarget, 0.08);
  currentWobble = lerp(currentWobble, wobbleTarget, 0.08);
  currentBg = lerpColor(currentBg, bgTarget, 0.06);

  background(currentBg);

  // camera control
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
    // gentle up/down
  } else if (scene.movementType === "wave") {
    offsetX = sin(t * 1.6) * baseRadius * 0.2 * (1 + levelBoost);
  } else if (scene.movementType === "pulse") {
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
  text(scene.name, 24, height - 48);

  textSize(12);
  fill(230);
  text(scene.tagline, 24, height - 30);

  textSize(11);
  fill(210);
  text(
    "Left-drag: orbit • Right-click / 1–7: change mood • Space: pause/play",
    24,
    height - 12
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
  } else if (key === "4") {
    setScene(3);
  } else if (key === "5") {
    setScene(4);
  } else if (key === "6") {
    setScene(5);
  } else if (key === "7") {
    setScene(6);
  } else if (key === " ") {
    togglePlayPause();
  }
}

function switchAudioToCurrentScene() {
  const scene = scenes[currentSceneIndex];
  const idx = currentSceneIndex; // same index as scenes & tracks

  // stop previous track if it exists
  if (currentTrack && currentTrack.isPlaying()) {
    currentTrack.stop();
  }

  currentTrack = tracks[idx];

  if (currentTrack) {
    currentTrack.loop();
    amplitude.setInput(currentTrack);
  } else {
    console.warn("No track loaded for mood:", scene.name);
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
