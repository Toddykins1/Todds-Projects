// --- In-game clock ---
const gameStart = performance.now();
function updateClock() {
  const minsPassed = Math.floor((performance.now() - gameStart) / 1000);
  let mins = (7 * 60) + minsPassed; // start at 7:00
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? "AM" : "PM";
  document.getElementById('clock').textContent = `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
}
setInterval(updateClock, 1000);
updateClock();

// --- Constants ---
const TILE_COUNT = 50;
const TILE_SIZE = 32;
const WORLD_SIZE = TILE_COUNT * TILE_SIZE;
const NUM_CIRCLES = 21;
const ACCEL = 2000 / 6;
const SPRINT_MULT = 1.8;
const DRAG = 1.6;
const MAX_DT = 0.1;
const WALL_RESTITUTION = 0.7;
const BLOCK_RESTITUTION = 1;

// --- Canvas Setup ---
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

// --- Input State ---
const keys = {};
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup',   e => keys[e.key.toLowerCase()] = false);

let mouse = { x: 0, y: 0 };
canvas.addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; cancelDestructionIfMoved(); });
canvas.addEventListener('pointerdown', e => { if (e.button === 0) startDestruction(); });
canvas.addEventListener('pointerup',   e => { if (e.button === 0) cancelDestruction(); });
canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
  const { tx, ty } = screenToTile(e.clientX, e.clientY);
  if (
    inBounds(tx, ty) &&
    inRange(tx, ty, player.tileX, player.tileY, 4) &&
    !grid[ty][tx] &&
    !trees.find(t => t.tx === tx && t.ty === ty) &&
    !circles.some(c => Math.floor(c.x / TILE_SIZE) === tx && Math.floor(c.y / TILE_SIZE) === ty)
  ) {
    grid[ty][tx] = true;
  }
});

// --- World Data ---
const grid = Array.from({ length: TILE_COUNT }, () => Array(TILE_COUNT).fill(false));
const trees = [];
for (let ty = -12; ty < TILE_COUNT + 12; ty++) {
  for (let tx = -12; tx < TILE_COUNT + 12; tx++) {
    if (Math.random() < 0.015) trees.push({ tx, ty });
  }
}

const circles = [];
class Circle {
  constructor(x, y, r, isPlayer = false) {
    this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.r = r; this.isPlayer = isPlayer;
    // --- Status Bars (added) ---
    if (isPlayer) {
      this.health = 100;   // Health percentage [0, 100]
      this.stamina = 100;  // Stamina percentage [0, 100]
      this.hunger = 100;   // Hunger percentage [0, 100]
    }
  }
  get tileX() { return Math.floor(this.x / TILE_SIZE); }
  get tileY() { return Math.floor(this.y / TILE_SIZE); }
}
const player = new Circle(WORLD_SIZE/2, WORLD_SIZE/2, TILE_SIZE * 0.4, true);
circles.push(player);
for (let i = 1; i < NUM_CIRCLES; i++) {
  const angle = Math.random() * Math.PI * 2;
  const dist  = Math.random() * WORLD_SIZE * 0.5;
  const x = WORLD_SIZE/2 + Math.cos(angle) * dist;
  const y = WORLD_SIZE/2 + Math.sin(angle) * dist;
  const c = new Circle(x, y, TILE_SIZE * 0.4);
  c.vx = (Math.random() - 0.5) * (200 / 6);
  c.vy = (Math.random() - 0.5) * (200 / 6);
  circles.push(c);
}

// --- Destruction State ---
let destroyBlock = { active: false, start: 0, tx: -1, ty: -1 };
let destroyTree  = { active: false, start: 0, tx: -1, ty: -1 };

function startDestruction() {
  const { tx, ty } = screenToTile(mouse.x, mouse.y);
  if (inBounds(tx, ty) && inRange(tx, ty, player.tileX, player.tileY, 4)) {
    if (grid[ty][tx]) destroyBlock = { active: true, start: performance.now(), tx, ty };
    else if (trees.find(t => t.tx === tx && t.ty === ty)) destroyTree = { active: true, start: performance.now(), tx, ty };
  }
}
function cancelDestruction() { destroyBlock.active = destroyTree.active = false; }
function cancelDestructionIfMoved() {
  const { tx, ty } = screenToTile(mouse.x, mouse.y);
  if (destroyBlock.active && (tx !== destroyBlock.tx || ty !== destroyBlock.ty || !grid[ty][tx])) destroyBlock.active = false;
  if (destroyTree.active  && (tx !== destroyTree.tx  || ty !== destroyTree.ty  || trees.findIndex(t=>t.tx===tx&&t.ty===ty)<0)) destroyTree.active = false;
}

// --- Utilities ---
function clamp(v, min, max) { return v < min ? min : v > max ? max : v; }
function inBounds(x, y) { return x >= 0 && y >= 0 && x < TILE_COUNT && y < TILE_COUNT; }
function inRange(x1, y1, x2, y2, r) { return Math.hypot(x1 - x2, y1 - y2) <= r; }
function screenToWorld(sx, sy) { return { x: camera.x + (sx - canvas.width/2), y: camera.y + (sy - canvas.height/2) }; }
function worldToScreen(wx, wy) { return { x: (wx - camera.x) + canvas.width/2, y: (wy - camera.y) + canvas.height/2 }; }
function screenToTile(sx, sy) { const w = screenToWorld(sx, sy); return { tx: Math.floor(w.x / TILE_SIZE), ty: Math.floor(w.y / TILE_SIZE) }; }

// --- Physics ---
function resolveCircleCollision(a, b) {
  const dx=b.x-a.x, dy=b.y-a.y, dist=Math.hypot(dx,dy);
  if(!dist) return;
  const overlap=a.r+b.r-dist;
  if(overlap>0){
    const nx=dx/dist, ny=dy/dist;
    a.x -= nx*overlap/2; a.y -= ny*overlap/2;
    b.x += nx*overlap/2; b.y += ny*overlap/2;
    const rvx=b.vx-a.vx, rvy=b.vy-a.vy;
    const velAlong=rvx*nx+rvy*ny;
    if(velAlong>0) return;
    const impulse=-(1+0.9)*velAlong/2;
    a.vx -= impulse*nx; a.vy -= impulse*ny;
    b.vx += impulse*nx; b.vy += impulse*ny;
  }
}
function resolveCircleBlock(c, tx, ty) {
  const rx=tx*TILE_SIZE, ry=ty*TILE_SIZE;
  const cx=clamp(c.x, rx, rx+TILE_SIZE), cy=clamp(c.y, ry, ry+TILE_SIZE);
  const dx=c.x-cx, dy=c.y-cy, dist=Math.hypot(dx,dy);
  if(dist< c.r && dist>0){
    const nx=dx/dist, ny=dy/dist, overlap=c.r-dist;
    c.x += nx*overlap; c.y += ny*overlap;
    const velAlong=c.vx*nx+c.vy*ny;
    if(velAlong<0){
      const speed=Math.hypot(c.vx,c.vy);
      const factor=speed>0?Math.min(Math.abs(velAlong)/speed,1):0;
      const r=BLOCK_RESTITUTION;
      c.vx -= velAlong*nx*r;
      c.vy -= velAlong*ny*r;
    }
  }
}

// --- Camera ---
const camera={x:player.x,y:player.y};

// #### End of page 1 ####