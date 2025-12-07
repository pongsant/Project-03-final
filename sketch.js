// ==== Mood configuration ====

const moods = {
  love: {
    label: "Love",
    colors: ["#ffc6d9", "#ff71a0"],
    description:
      "Love feels like a soft pink glow — warm, slow, and a little bit dreamy.",
    file: "love.mp3"
  },
  happy: {
    label: "Happy",
    colors: ["#ffe8a3", "#ffd44d"],
    description:
      "Happy is bright yellow light, bouncing and sparkling like a sunbeam.",
    file: "happy.mp3"
  },
  calm: {
    label: "Calm",
    colors: ["#c1f1ff", "#4ba6d8"],
    description:
      "Calm moves in slow blue waves, like breathing with the ocean at night.",
    file: "calm.mp3"
  },
  dream: {
    label: "Dream",
    colors: ["#d3c2ff", "#7c5cff"],
    description:
      "Dream drifts in violet haze, floating between sleep, memory, and starlight.",
    file: "dream.mp3"
  },
  hope: {
    label: "Hope",
    colors: ["#c7ffd4", "#5bd38a"],
    description:
      "Hope glows in soft mint and green, opening slowly like a new morning.",
    file: "hope.mp3"
  },
  alone: {
    label: "Alone",
    colors: ["#9fa7ff", "#3b447a"],
    description:
      "Alone feels deep and blue, but still pulsing quietly with your own heartbeat.",
    file: "alone.mp3"
  },
  nostalgia: {
    label: "Nostalgia",
    colors: ["#ffd9b3", "#ff9c6b"],
    description:
      "Nostalgia burns like faded orange film, replaying old scenes in soft light.",
    file: "nostalgia.mp3"
  }
};

let moodSounds = {};
let currentMoodKey = "love";
let currentSound = null;

let fft, amplitude;
let rotationXAngle = -0.3;
let rotationYAngle = 0.5;
let dragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// For one-time audio start on user interaction
let audioStarted = false;

// ==== p5 lifecycle ====

function preload() {
  soundFormats("mp3");

  // Load all mood sounds from same folder
  for (const key in moods) {
    const m = moods[key];
    moodSounds[key] = loadSound(m.file);
  }
}

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  canvas.elt.oncontextmenu = () => false; // disable right-click menu

  fft = new p5.FFT(0.8, 64);
  amplitude = new p5.Amplitude();
  amplitude.smooth(0.8);

  // Hook up mood buttons
  setupMoodButtons();

  // Start with LOVE mood (sound will actually play after first user click)
  selectMood("love", { autoplay: false });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  // Get audio data
  let level = currentSound ? amplitude.getLevel() : 0;
  level = constrain(level * 3, 0, 1); // boost a bit but clamp

  const spectrum = currentSound ? fft.analyze() : [];

  // Convert mood colors to p5 colors
  const mood = moods[currentMoodKey];
  const c1 = color(mood.colors[0]);
  const c2 = color(mood.colors[1]);

  // Clear with dark base
  background(5, 5, 20);

  // ---- 2D background waves (not rotating) ----
  drawBackgroundWaves(level, spectrum, c1, c2);

  // ---- 3D orb ----
  push();

  // Soft lights from mood colors
  const r = red(c2);
  const g = green(c2);
  const b = blue(c2);

  ambientLight(25);
  directionalLight(r, g, b, 0.4, -0.6, -1);
  pointLight(255, 255, 255, 0, 0, 300);

  rotateX(rotationXAngle);
  rotateY(rotationYAngle);

  // Orb size reacts to volume
  const baseSize = min(width, height) * 0.35;
  const orbSize = baseSize + level * baseSize * 0.3;

  noStroke();
  shininess(60);

  // Slight color pulse with the music
  const pulse = 0.3 + level * 0.7;
  const orbColor = lerpColor(c1, c2, pulse);
  specularMaterial(orbColor);

  sphere(orbSize, 80, 80);

  // Little orbiting particles around the orb
  drawOrbitingParticles(orbSize, level, c1, c2);

  pop();
}

// ==== Background & particles ====

function drawBackgroundWaves(level, spectrum, c1, c2) {
  push();
  resetMatrix(); // remove WEBGL rotations
  translate(-width / 2, -height / 2);

  noFill();
  const numRings = 10;
  const time = millis() * 0.001;

  for (let i = 0; i < numRings; i++) {
    const t = i / (numRings - 1);
    const col = lerpColor(c1, c2, t);
    const alpha = map(i, 0, numRings - 1, 80, 10);
    col.setAlpha(alpha);

    stroke(col);
    strokeWeight(1.2);

    const baseRadius = lerp(120, max(width, height) * 0.9, t);
    const wobble = sin(time * 1.2 + i * 0.6) * 40 * (0.3 + level);
    const radius = baseRadius + wobble;

    push();
    translate(width / 2, height / 2);
    ellipse(0, 0, radius * 2, radius * 2 * (0.7 + level * 0.6));
    pop();
  }

  // Optional: a subtle waveform at the bottom
  if (spectrum.length > 0) {
    stroke(lerpColor(c1, c2, 0.5));
    strokeWeight(1);
    noFill();
    beginShape();
    const yBase = height * 0.8;
    for (let i = 0; i < spectrum.length; i++) {
      const x = map(i, 0, spectrum.length - 1, width * 0.1, width * 0.9);
      const amp = map(spectrum[i], 0, 255, 0, 60) * (0.4 + level);
      const y = yBase - amp;
      vertex(x, y);
    }
    endShape();
  }

  pop();
}

function drawOrbitingParticles(orbSize, level, c1, c2) {
  const time = millis() * 0.001;
  const count = 35;

  for (let i = 0; i < count; i++) {
    const t = i / count;
    const angle = time * 0.9 + t * TWO_PI * 2;
    const tilt = sin(time * 0.6 + i * 0.5) * 0.9;

    const radius = orbSize * (1.2 + t * 0.4 + level * 0.4);
    const x = cos(angle) * radius;
    const y = sin(angle) * radius * tilt;
    const z = sin(time * 0.7 + i) * orbSize * 0.3 * (0.2 + level);

    const col = lerpColor(c1, c2, t);
    col.setAlpha(180);
    ambientMaterial(col);

    push();
    translate(x, y, z);
    sphere(6 + level * 10, 8, 8);
    pop();
  }
}

// ==== Mood + UI logic ====

function setupMoodButtons() {
  const buttons = document.querySelectorAll(".mood-button");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const moodKey = btn.getAttribute("data-mood");
      selectMood(moodKey, { autoplay: true });
    });
  });
}

function selectMood(moodKey, options = { autoplay: true }) {
  if (!moods[moodKey]) return;
  currentMoodKey = moodKey;

  // Update button UI
  const buttons = document.querySelectorAll(".mood-button");
  buttons.forEach((btn) => {
    if (btn.getAttribute("data-mood") === moodKey) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Update description
  const descEl = document.getElementById("mood-description");
  if (descEl) {
    descEl.textContent = moods[moodKey].description;
  }

  // Switch sound
  const newSound = moodSounds[moodKey];
  if (!newSound) return;

  if (currentSound && currentSound.isPlaying()) {
    currentSound.stop();
  }

  currentSound = newSound;
  fft.setInput(currentSound);
  amplitude.setInput(currentSound);

  if (options.autoplay && audioStarted) {
    currentSound.loop();
  }
}

// ==== Interaction ====

function mousePressed() {
  // Start audio context on first click (required by browsers)
  if (!audioStarted) {
    userStartAudio();
    audioStarted = true;

    // If we already have a mood selected, start playing it
    if (currentSound && !currentSound.isPlaying()) {
      currentSound.loop();
    }
  }

  if (mouseButton === LEFT) {
    dragging = true;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
  }
}

function mouseDragged() {
  if (dragging) {
    const dx = mouseX - lastMouseX;
    const dy = mouseY - lastMouseY;

    rotationYAngle += dx * 0.01;
    rotationXAngle += dy * 0.01;

    lastMouseX = mouseX;
    lastMouseY = mouseY;
  }
}

function mouseReleased() {
  dragging = false;
}

function keyPressed() {
  // Space = pause / play
  if (key === " ") {
    if (currentSound) {
      if (currentSound.isPlaying()) {
        currentSound.pause();
      } else {
        if (!audioStarted) {
          userStartAudio();
          audioStarted = true;
        }
        currentSound.loop();
      }
    }
  }

  // Number keys to jump moods quickly (1–7)
  if (key === "1") selectMood("love", { autoplay: true });
  if (key === "2") selectMood("happy", { autoplay: true });
  if (key === "3") selectMood("calm", { autoplay: true });
  if (key === "4") selectMood("dream", { autoplay: true });
  if (key === "5") selectMood("hope", { autoplay: true });
  if (key === "6") selectMood("alone", { autoplay: true });
  if (key === "7") selectMood("nostalgia", { autoplay: true });
}
