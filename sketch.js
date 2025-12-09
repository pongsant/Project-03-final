// MUSIC ORB — single-user version with mood → Unity link

let moods = [
  {
    id: "calm",
    label: "Calm",
    color: [112, 164, 255],
    file: "calm.mp3",
  },
  {
    id: "happy",
    label: "Happy",
    color: [255, 215, 90],
    file: "happy.mp3",
  },
  {
    id: "love",
    label: "love",
    color: [255, 137, 181],
    file: "love.mp3",
  },
  {
    id: "dream",
    label: "Dream",
    color: [200, 164, 255],
    file: "dream.mp3",
  },
  {
    id: "hope",
    label: "Hope",
    color: [143, 255, 209],
    file: "hope.mp3",
  },
  {
    id: "nostalgia",
    label: "Nostalgia",
    color: [255, 178, 122],
    file: "nostalgia.mp3",
  },
  {
    id: "alone",
    label: "Alone",
    color: [122, 139, 255],
    file: "alone.mp3",
  },
];

let sounds = [];
let currentMoodIndex = 0;
let currentSound = null;

let amplitude;
let angle = 0;
let baseRadius;

// === p5 lifecycle ===
function preload() {
  // load all sounds
  for (let m of moods) {
    sounds.push(loadSound(m.file));
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
  angleMode(RADIANS);

  amplitude = new p5.Amplitude();
  amplitude.smooth(0.8);

  baseRadius = min(windowWidth, windowHeight) * 0.18;

  setupLegendClicks();
  switchMood(0); // start with Calm
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  baseRadius = min(windowWidth, windowHeight) * 0.18;
}

function draw() {
  clear(); // let CSS background show

  let mood = moods[currentMoodIndex];
  let col = mood.color;

  // soft background haze behind orb
  push();
  translate(0, 0, -200);
  for (let i = 0; i < 3; i++) {
    let alpha = 40 - i * 10;
    fill(col[0], col[1], col[2], alpha);
    sphere(baseRadius * (1.7 + i * 0.2), 24, 16);
  }
  pop();

  // audio-reactive orb
  let level = amplitude.getLevel();
  let bump = map(level, 0, 0.25, 0, baseRadius * 0.5, true);

  rotateY(angle * 0.7);
  rotateX(angle * 0.3);
  angle += 0.01 + level * 0.06;

  ambientLight(80);
  directionalLight(col[0], col[1], col[2], -1, -0.3, -0.5);

  let orbRadius = baseRadius + bump;

  // outer soft shell
  push();
  fill(col[0], col[1], col[2], 180);
  specularMaterial(col[0], col[1], col[2], 200);
  shininess(60);
  sphere(orbRadius, 64, 48);
  pop();

  // inner core
  push();
  fill(255, 255, 255, 220);
  sphere(orbRadius * 0.55, 32, 24);
  pop();

  // little floating rings
  let ringCount = 5;
  for (let i = 0; i < ringCount; i++) {
    let t = angle * (0.8 + i * 0.15);
    let r = orbRadius * (1.05 + i * 0.06);
    let y = sin(t * 1.2 + i) * orbRadius * 0.2;

    push();
    rotateY(t + i * 0.3);
    translate(r, y, 0);
    fill(col[0], col[1], col[2], 150 - i * 18);
    sphere(8 + i * 1.5, 12, 8);
    pop();
  }
}

// === Mood + audio control ===

function setupLegendClicks() {
  const items = document.querySelectorAll(".legend-item");
  items.forEach((item) => {
    item.addEventListener("click", () => {
      const idx = parseInt(item.getAttribute("data-index"));
      switchMood(idx);
    });
  });
}

function switchMood(index) {
  if (index < 0 || index >= moods.length) return;

  // stop old sound
  if (currentSound && currentSound.isPlaying()) {
    currentSound.stop();
  }

  currentMoodIndex = index;
  const mood = moods[currentMoodIndex];
  currentSound = sounds[currentMoodIndex];

  // update legend active state
  const items = document.querySelectorAll(".legend-item");
  items.forEach((item) => item.classList.remove("active"));
  const active = document.querySelector(
    `.legend-item[data-index="${currentMoodIndex}"]`
  );
  if (active) active.classList.add("active");

  // start audio (user gesture)
  userStartAudio();
  if (currentSound && !currentSound.isPlaying()) {
    currentSound.loop();
    currentSound.setVolume(0.8);
  }
}

// === open Unity world with current mood ===

function openUnityWorld() {
  const moodId = moods[currentMoodIndex].id; // e.g. "love"
  // UnityBuild is the folder name you used when building WebGL
  const url = `UnityBuild/index.html?mood=${encodeURIComponent(moodId)}`;
  window.open(url, "_blank"); // new tab; use window.location.href if you want same tab
}

// ---------- UNITY BRIDGE ----------
// Opens the Unity WebGL build with the current mood as a URL parameter.
// Example: UnityBuild/index.html?mood=love
function openUnityWorld() {
  // use current scene's name as mood id (Calm, Happy, Love, etc.)
  let moodName = "calm";
  if (scenes && scenes[currentSceneIndex]) {
    moodName = scenes[currentSceneIndex].name.toLowerCase();
  }

  // UnityBuild is the folder where you build your WebGL scene
  const url = `UnityBuild/index.html?mood=${encodeURIComponent(moodName)}`;

  // open in new tab so your music/orb page stays open
  window.open(url, "_blank");
}
