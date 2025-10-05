const CHUNK_SIZE = 512;
const OVERLAP = 1; // Overlap by 1 pixel
const EFFECTIVE_CHUNK = CHUNK_SIZE - OVERLAP; // How far to offset next chunk

const state = {
  width: window.innerWidth,
  height: window.innerHeight,
  mouseAngle: 0,
  keys: Object.create(null),
  entities: [],
  running: true,
  chunkCache: {},
  _frames: 0,
  _fps: 0,
  _lastFpsTime: performance.now(),

  overlayStart: performance.now(),
  dayMinutes: 420,
  dayLastReal: performance.now(),
};

const GameScreen = { START: "start", PLAYING: "playing", PAUSED: "paused" };
let gameScreen = GameScreen.START;

// === INPUT HANDLING ===
const Input = (() => {
  function normalizeKey(e) { return e.key ? e.key.toLowerCase() : ""; }
  function clearAllKeys() { for (const key of Object.keys(state.keys)) state.keys[key] = false; }
  function setup(canvas) {
    window.addEventListener('keydown', e => state.keys[normalizeKey(e)] = true);
    window.addEventListener('keyup', e => state.keys[normalizeKey(e)] = false);
    canvas.addEventListener('mousemove', e => {
      if (document.pointerLockElement === canvas) state.mouseAngle -= e.movementX * 0.0075;
    });
    canvas.addEventListener('click', () => {
      if (document.pointerLockElement !== canvas && gameScreen === GameScreen.PLAYING) canvas.requestPointerLock();
    });
    window.addEventListener('resize', () => {
      state.width = window.innerWidth; state.height = window.innerHeight;
      canvas.width = state.width; canvas.height = state.height;
      canvas.style.imageRendering = "pixelated";
    });
    window.addEventListener('blur', clearAllKeys);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== "visible") clearAllKeys();
    });
    canvas.oncontextmenu = e => e.preventDefault();
    canvas.onselectstart = e => e.preventDefault();
    canvas.onmousedown = e => { if (e.button === 2) e.preventDefault(); };
  }
  function getKey(k) { return !!state.keys[k]; }
  return { setup, getKey };
})();

// === PLAYER ===
function createPlayer(x, y) {
  return {
    type: "player", x, y, vx: 0, vy: 0,
    r: 25, mass: 0.8,
    speed: 3000, maxSpeed: 9000,
    friction: 0.82, restitution: 0.29,
    color: "#fff", controller: true,
  };
}

// === MOVEMENT SYSTEM ===
function MovementSystem(dt, entities, mapAngle) {
  for (const ent of entities) {
    if (ent.controller) {
      let ax = 0, ay = 0;
      let s = ent.speed * (Input.getKey('shift') ? 1.7 : 1.0);
      if (Input.getKey('w') || Input.getKey('arrowup')) ay -= s;
      if (Input.getKey('s') || Input.getKey('arrowdown')) ay += s;
      if (Input.getKey('a') || Input.getKey('arrowleft')) ax -= s;
      if (Input.getKey('d') || Input.getKey('arrowright')) ax += s;
      let cos = Math.cos(-mapAngle), sin = Math.sin(-mapAngle);
      let rax = ax * cos - ay * sin, ray = ax * sin + ay * cos;
      ent.vx += rax * dt / ent.mass; ent.vy += ray * dt / ent.mass;
      ent.vx *= ent.friction; ent.vy *= ent.friction;
      let v = Math.hypot(ent.vx, ent.vy);
      if (v > ent.maxSpeed) {
        ent.vx = ent.vx / v * ent.maxSpeed; ent.vy = ent.vy / v * ent.maxSpeed;
      }
      ent.x += ent.vx * dt; ent.y += ent.vy * dt;
    }
  }
}

// === RENDER PLAYER ===
function RenderSystem(ctx, entities) {
  for (const ent of entities) {
    if (ent.type === "player") {
      ctx.save();
      ctx.translate(state.width / 2, state.height / 2);
      ctx.beginPath(); ctx.arc(0, 0, ent.r, 0, Math.PI * 2);
      ctx.fillStyle = ent.color; ctx.shadowColor = "#0006"; ctx.shadowBlur = 10; ctx.fill();
      ctx.save();
      ctx.globalAlpha = 0.36; ctx.strokeStyle = "#222"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -45); ctx.stroke();
      ctx.restore();
      ctx.restore();
    }
  }
}

// === INFINITE NOISE FIELD WORLD SYSTEM ===
const noiseColors = [];
for (let i = 0; i < 32; i++) {
  let hue = 117 + (i % 8) * 0.8;
  let sat = 15 + (i % 4) * 1.1;
  let light = 19 + Math.floor(i / 4) * 0.7;
  noiseColors.push(hslToRgb(hue, sat, light));
}
function rand(gx, gy) {
  let n = gx * 374761393 + gy * 668265263;
  n = (n ^ (n >> 13)) * 1274126177;
  return (n ^ (n >> 16)) & 31;
}
function hslToRgb(h, s, l) {
  s /= 100; l /= 100; h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ];
}

// Each chunk is CHUNK_SIZE x CHUNK_SIZE, overlapping by 1 pixel at right/bottom
function getChunk(cx, cy) {
  const key = `${cx}_${cy}`;
  if (state.chunkCache[key]) return state.chunkCache[key];
  const chunk = document.createElement('canvas');
  chunk.width = chunk.height = CHUNK_SIZE;
  const ctx = chunk.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const image = ctx.createImageData(CHUNK_SIZE, CHUNK_SIZE);
  const data = image.data;
  for (let y = 0; y < CHUNK_SIZE; y++) {
    let gy = cy * EFFECTIVE_CHUNK + y;
    for (let x = 0; x < CHUNK_SIZE; x++) {
      let gx = cx * EFFECTIVE_CHUNK + x;
      const color = noiseColors[rand(gx, gy)];
      const i = (y * CHUNK_SIZE + x) * 4;
      data[i] = color[0];
      data[i+1] = color[1];
      data[i+2] = color[2];
      data[i+3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  state.chunkCache[key] = chunk;
  return chunk;
}

function drawWorld(ctx, centerWorldX, centerWorldY, screenW, screenH, mapAngle) {
  const radius = Math.sqrt((screenW/2)**2 + (screenH/2)**2);
  const visible = radius + CHUNK_SIZE;
  const minX = centerWorldX - visible, maxX = centerWorldX + visible;
  const minY = centerWorldY - visible, maxY = centerWorldY + visible;
  const minChunkX = Math.floor(minX / EFFECTIVE_CHUNK), maxChunkX = Math.floor(maxX / EFFECTIVE_CHUNK);
  const minChunkY = Math.floor(minY / EFFECTIVE_CHUNK), maxChunkY = Math.floor(maxY / EFFECTIVE_CHUNK);

  for (let cy = minChunkY; cy <= maxChunkY; cy++) {
    for (let cx = minChunkX; cx <= maxChunkX; cx++) {
      const chunk = getChunk(cx, cy);
      const chunkWorldX = cx * EFFECTIVE_CHUNK;
      const chunkWorldY = cy * EFFECTIVE_CHUNK;
      const dx = chunkWorldX - (centerWorldX - screenW / 2);
      const dy = chunkWorldY - (centerWorldY - screenH / 2);
      ctx.drawImage(chunk, Math.round(dx), Math.round(dy));
    }
  }
}

// === DARK BLUE NIGHT OVERLAY ===
function getOverlayAlphaAndColor(cycleSeconds) {
  let t = cycleSeconds % 1800;
  if (t < 900) return 0;
  if (t < 960) return ((t - 900) / 60) * 0.20;
  if (t < 1860) return 0.20;
  if (t < 1920) return (1 - (t - 1860) / 60) * 0.20;
  return 0;
}

function drawNightOverlay(ctx, w, h, overlayAlpha) {
  if (overlayAlpha > 0.001) {
    ctx.save();
    ctx.globalAlpha = overlayAlpha;
    ctx.fillStyle = "#07113d";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

// === MODULAR MINIMALIST GAME CLOCK (12h format) ===
function formatClock12h(hh, mm) {
  let h = ((hh % 12) === 0) ? 12 : (hh % 12);
  let suffix = (hh < 12) ? "AM" : "PM";
  return `${h.toString().padStart(2,'0')}:${mm.toString().padStart(2,'0')} ${suffix}`;
}

function updateClockDisplay(minutes) {
  const clockDiv = document.getElementById('gameClock');
  const hour = Math.floor(minutes / 60) % 24;
  const min = Math.floor(minutes % 60);
  clockDiv.textContent = formatClock12h(hour, min);
}

// === FPS COUNTER ===
function FpsSystem(ctx) {
  ctx.save();
  ctx.font = "18px monospace";
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "top";
  ctx.fillText("FPS: " + state._fps.toFixed(1), 8, 3);
  ctx.restore();
}

// === MAIN GAME LOOP ===
(function Main() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = state.width;
  canvas.height = state.height;
  canvas.style.imageRendering = "pixelated";
  ctx.imageSmoothingEnabled = false;
  Input.setup(canvas);

  state.entities.push(createPlayer(0, 0));
  let last = performance.now();

  // --- Overlay & clock initial sync ---
  state.overlayStart = performance.now();
  state.dayMinutes = 420; // 7:00am
  state.dayLastReal = performance.now();

  // Clock & HUD references
  const gameHudBox = document.getElementById('gameHudBox');
  function setHudVisibility(vis) {
    gameHudBox.style.display = vis ? "flex" : "none";
  }

  // Draw placeholder minimap square (gray, empty, future content)
  function drawMiniMap() {
    const miniMap = document.getElementById('miniMapCanvas');
    const mctx = miniMap.getContext('2d');
    mctx.clearRect(0, 0, miniMap.width, miniMap.height);
    // future: draw map, player position, etc.
  }

  function loop(now) {
    if (!state.running) return;
    if (gameScreen === GameScreen.START || gameScreen === GameScreen.PAUSED) {
      setHudVisibility(false);
      requestAnimationFrame(loop); return;
    }
    setHudVisibility(true);

    let dt = Math.min((now - last) / 1000, 0.045); last = now;
    const player = state.entities[0];
    const centerX = state.width / 2, centerY = state.height / 2;
    const mapAngle = state.mouseAngle || 0;

    // --- Virtual day timer update ---
    let realNow = now;
    let realDt = Math.max(0, (realNow - state.dayLastReal) / 1000);
    state.dayLastReal = realNow;
    let cycleSeconds = ((realNow - state.overlayStart) / 1000) % 1800;
    state.dayMinutes = 420 + (cycleSeconds * (1440 / 1800));
    if (state.dayMinutes >= 1440) state.dayMinutes -= 1440;
    updateClockDisplay(state.dayMinutes);

    MovementSystem(dt, state.entities, mapAngle);

    ctx.clearRect(0, 0, state.width, state.height);
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(mapAngle);
    ctx.translate(-centerX, -centerY);

    drawWorld(ctx, player.x, player.y, state.width, state.height, mapAngle);

    ctx.restore();
    RenderSystem(ctx, state.entities);

    // --- Draw Night Overlay ---
    let overlayAlpha = getOverlayAlphaAndColor(cycleSeconds);
    drawNightOverlay(ctx, state.width, state.height, overlayAlpha);

    state._frames++;
    if (now - state._lastFpsTime > 250) {
      state._fps = (state._frames * 1000) / (now - state._lastFpsTime);
      state._frames = 0; state._lastFpsTime = now;
    }
    FpsSystem(ctx);

    drawMiniMap();

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // === MENU/Pause/Start Handlers ===
  const startScreen = document.getElementById('startScreen');
  const pauseMenu = document.getElementById('pauseMenu');
  const btnContinue = document.getElementById('btnContinue');
  const btnControls = document.getElementById('btnControls');
  const btnQuit = document.getElementById('btnQuit');
  const controlsInfo = document.getElementById('controlsInfo');

  function resetGame() {
    state.entities = []; state.entities.push(createPlayer(0, 0)); state.mouseAngle = 0;
    state.overlayStart = performance.now();
    state.dayMinutes = 420;
    state.dayLastReal = performance.now();
  }
  function showGame() {
    startScreen.style.display = "none";
    pauseMenu.style.display = "none";
    controlsInfo.style.display = "none";
    gameScreen = GameScreen.PLAYING;
  }
  function showPause() {
    pauseMenu.style.display = "flex";
    controlsInfo.style.display = "none";
    gameScreen = GameScreen.PAUSED;
    setHudVisibility(false);
    if (document.pointerLockElement === canvas) document.exitPointerLock();
  }
  function hidePause() {
    pauseMenu.style.display = "none";
    controlsInfo.style.display = "none";
    if (gameScreen === GameScreen.PAUSED) gameScreen = GameScreen.PLAYING;
  }
  function showStart() {
    startScreen.style.display = "flex";
    pauseMenu.style.display = "none";
    controlsInfo.style.display = "none";
    gameScreen = GameScreen.START;
    setHudVisibility(false);
    if (document.pointerLockElement === canvas) document.exitPointerLock();
  }

  // ----- UPDATED START SCREEN: click-to-start (pointer lock in one go) -----
  startScreen.addEventListener("mousedown", (e) => {
    if (e.button === 0 && gameScreen === GameScreen.START) {
      showGame();
      document.getElementById('game').requestPointerLock();
    }
  });

  window.addEventListener("keydown", e => {
    if (gameScreen === GameScreen.START) {
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(e.key.toLowerCase())) {
        showGame();
        document.getElementById('game').requestPointerLock();
      }
    }
    if (gameScreen === GameScreen.PLAYING && e.key === "Escape") showPause();
  });

  btnContinue.onclick = () => {
    hidePause();
    canvas.requestPointerLock();
  };

  btnControls.onclick = () => { controlsInfo.style.display = controlsInfo.style.display === "none" ? "block" : "none"; };
  btnQuit.onclick = () => { showStart(); resetGame(); };
  showStart();

  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement !== canvas) {
      if (gameScreen === GameScreen.PLAYING) {
        showPause();
      } else if (gameScreen === GameScreen.START) {
        showStart();
      }
    }
  });
})();
