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

// --- Survival System Constants ---
const INVENTORY_SIZE = 30; // 6x5 grid
const FORAGE_RANGE = 80; // Distance to forage
const FORAGE_COOLDOWN = 3; // Seconds between forage attempts
const HUNGER_DEPLETION_RATE = 0.02; // Much slower hunger depletion (per second)
const FOOD_SPOILAGE_RATE = 0.001; // Food spoils over time (per second)

// Food types with different properties
const FOOD_TYPES = {
  '🍎': { name: 'Apple', hunger: 15, spoilage: 0.002, rarity: 0.3 },
  '🍄': { name: 'Mushroom', hunger: 12, spoilage: 0.005, rarity: 0.4 },
  '🥜': { name: 'Nuts', hunger: 20, spoilage: 0.0005, rarity: 0.2 },
  '🌿': { name: 'Herbs', hunger: 8, spoilage: 0.008, rarity: 0.5 },
  '🍯': { name: 'Honey', hunger: 25, spoilage: 0.0001, rarity: 0.1 },
  '🥕': { name: 'Root Vegetable', hunger: 18, spoilage: 0.001, rarity: 0.25 },
  '🍇': { name: 'Berries', hunger: 10, spoilage: 0.006, rarity: 0.35 },
  '🐟': { name: 'Fish', hunger: 30, spoilage: 0.01, rarity: 0.15 }
};

// --- Canvas Setup ---
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

// --- Input State ---
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === 'i') {
    toggleInventory();
  }
  if (e.key.toLowerCase() === 'f') {
    attemptForage();
  }
  // Number keys 1-9 for eating food
  if (e.key >= '1' && e.key <= '9') {
    const slotIndex = parseInt(e.key) - 1;
    eatFoodFromSlot(slotIndex);
  }
});
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

// --- Inventory System ---
class Inventory {
  constructor(size) {
    this.slots = new Array(size).fill(null);
  }
  
  addItem(item, count = 1, freshness = 1.0) {
    // First try to stack with existing items of same type and similar freshness
    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i] && 
          this.slots[i].item === item && 
          Math.abs(this.slots[i].freshness - freshness) < 0.1) {
        this.slots[i].count += count;
        this.slots[i].freshness = Math.min(1.0, (this.slots[i].freshness + freshness) / 2);
        return true;
      }
    }
    
    // If no existing stack, find empty slot
    for (let i = 0; i < this.slots.length; i++) {
      if (!this.slots[i]) {
        this.slots[i] = { item, count, freshness };
        return true;
      }
    }
    
    return false; // Inventory full
  }
  
  removeItem(item, count = 1) {
    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i] && this.slots[i].item === item) {
        if (this.slots[i].count >= count) {
          this.slots[i].count -= count;
          if (this.slots[i].count <= 0) {
            this.slots[i] = null;
          }
          return true;
        }
      }
    }
    return false;
  }
  
  hasItem(item, count = 1) {
    let total = 0;
    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i] && this.slots[i].item === item) {
        total += this.slots[i].count;
      }
    }
    return total >= count;
  }
  
  getItemCount(item) {
    let total = 0;
    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i] && this.slots[i].item === item) {
        total += this.slots[i].count;
      }
    }
    return total;
  }
  
  updateFoodSpoilage(dt) {
    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i] && FOOD_TYPES[this.slots[i].item]) {
        const foodType = FOOD_TYPES[this.slots[i].item];
        this.slots[i].freshness -= foodType.spoilage * dt;
        if (this.slots[i].freshness <= 0) {
          this.slots[i] = null; // Food spoiled
        }
      }
    }
  }
}

const playerInventory = new Inventory(INVENTORY_SIZE);

// --- Foraging System ---
let lastForageTime = 0;
const forageAreas = [];

class ForageArea {
  constructor(x, y, radius = 60) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.lastForaged = 0;
    this.respawnTime = 30; // 30 seconds to respawn
    this.available = true;
  }
  
  canForage() {
    return this.available && (performance.now() - this.lastForaged) / 1000 > this.respawnTime;
  }
  
  forage() {
    if (!this.canForage()) return null;
    
    this.lastForaged = performance.now();
    this.available = false;
    
    // Generate food based on rarity
    const foods = Object.keys(FOOD_TYPES);
    const availableFoods = foods.filter(food => Math.random() < FOOD_TYPES[food].rarity);
    
    if (availableFoods.length === 0) return null;
    
    const selectedFood = availableFoods[Math.floor(Math.random() * availableFoods.length)];
    const count = Math.random() < 0.3 ? 2 : 1; // 30% chance for 2 items
    
    return { item: selectedFood, count, freshness: 0.8 + Math.random() * 0.2 };
  }
  
  update(dt) {
    if (!this.available && (performance.now() - this.lastForaged) / 1000 > this.respawnTime) {
      this.available = true;
    }
  }
  
  draw(ctx, camera) {
    if (!this.available) return;
    
    const { x: sx, y: sy } = worldToScreen(this.x, this.y);
    const distance = Math.hypot(player.x - this.x, player.y - this.y);
    
    if (distance < FORAGE_RANGE) {
    ctx.save();
      ctx.strokeStyle = 'rgba(255, 193, 7, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
      ctx.stroke();
    ctx.restore();
    }
  }
}

// Initialize forage areas
function initializeForageAreas() {
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * WORLD_SIZE;
    const y = Math.random() * WORLD_SIZE;
    forageAreas.push(new ForageArea(x, y));
  }
}

// --- Inventory UI ---
function toggleInventory() {
  const inventory = document.getElementById('inventory');
  inventory.style.display = inventory.style.display === 'none' ? 'block' : 'none';
  if (inventory.style.display === 'block') {
    updateInventoryDisplay();
  }
}

function updateInventoryDisplay() {
  const grid = document.getElementById('inventory-grid');
  grid.innerHTML = '';
  
  for (let i = 0; i < INVENTORY_SIZE; i++) {
    const slot = document.createElement('div');
    slot.className = 'inventory-slot';
    slot.dataset.slot = i;
    
    if (playerInventory.slots[i]) {
      slot.classList.add('has-item');
      slot.textContent = playerInventory.slots[i].item;
      if (playerInventory.slots[i].count > 1) {
        const count = document.createElement('div');
        count.className = 'item-count';
        count.textContent = playerInventory.slots[i].count;
        slot.appendChild(count);
      }
      
      // Add freshness indicator
      const freshness = playerInventory.slots[i].freshness;
      if (freshness < 0.3) {
        slot.style.borderColor = '#ff4444'; // Red for spoiled
      } else if (freshness < 0.6) {
        slot.style.borderColor = '#ffaa00'; // Orange for getting old
      }
      
      // Tooltip
      slot.addEventListener('mouseenter', (e) => {
        const tooltip = document.createElement('div');
        tooltip.className = 'item-tooltip';
        const foodType = FOOD_TYPES[playerInventory.slots[i].item];
        tooltip.innerHTML = `
          <strong>${foodType.name}</strong><br>
          Hunger: +${foodType.hunger}<br>
          Freshness: ${Math.round(freshness * 100)}%<br>
          Press ${i + 1} to eat
        `;
        tooltip.style.left = e.pageX + 10 + 'px';
        tooltip.style.top = e.pageY - 10 + 'px';
        document.body.appendChild(tooltip);
        slot._tooltip = tooltip;
      });
      
      slot.addEventListener('mouseleave', () => {
        if (slot._tooltip) {
          document.body.removeChild(slot._tooltip);
          slot._tooltip = null;
        }
      });
    }
    
    grid.appendChild(slot);
  }
  
  updateFoodList();
}

function updateFoodList() {
  const foodList = document.getElementById('food-list');
  foodList.innerHTML = '';
  
  const foodSlots = [];
  for (let i = 0; i < INVENTORY_SIZE; i++) {
    if (playerInventory.slots[i] && FOOD_TYPES[playerInventory.slots[i].item]) {
      foodSlots.push({ slot: i, ...playerInventory.slots[i] });
    }
  }
  
  foodSlots.forEach((foodSlot, index) => {
    const foodType = FOOD_TYPES[foodSlot.item];
    const foodDiv = document.createElement('div');
    foodDiv.className = 'food-item';
    if (foodSlot.freshness > 0.3) {
      foodDiv.classList.add('available');
    }
    
    const freshnessColor = foodSlot.freshness > 0.6 ? '#4CAF50' : 
                          foodSlot.freshness > 0.3 ? '#FFC107' : '#ff4444';
    
    foodDiv.innerHTML = `
      <span class="food-name">${foodSlot.item} ${foodType.name} (${foodSlot.count})</span>
      <span class="food-stats" style="color: ${freshnessColor}">
        +${foodType.hunger} hunger | ${Math.round(foodSlot.freshness * 100)}% fresh | Press ${foodSlot.slot + 1}
      </span>
    `;
    
    foodDiv.onclick = () => eatFoodFromSlot(foodSlot.slot);
    foodList.appendChild(foodDiv);
  });
}

function eatFoodFromSlot(slotIndex) {
  if (slotIndex >= INVENTORY_SIZE || !playerInventory.slots[slotIndex]) return;
  
  const slot = playerInventory.slots[slotIndex];
  const foodType = FOOD_TYPES[slot.item];
  
  if (!foodType) return;
  
  // Calculate hunger restoration based on freshness
  const hungerRestore = Math.round(foodType.hunger * slot.freshness);
  player.hunger = Math.min(100, player.hunger + hungerRestore);
  
  // Remove one item
  playerInventory.removeItem(slot.item, 1);
  
  // Show feedback
  showEatingFeedback(hungerRestore, slot.item);
  updateInventoryDisplay();
}

function attemptForage() {
  const now = performance.now();
  if (now - lastForageTime < FORAGE_COOLDOWN * 1000) return;
  
  lastForageTime = now;
  
  let foraged = false;
  forageAreas.forEach(area => {
    const distance = Math.hypot(player.x - area.x, player.y - area.y);
    if (distance < FORAGE_RANGE && area.canForage()) {
      const result = area.forage();
      if (result) {
        if (playerInventory.addItem(result.item, result.count, result.freshness)) {
          showForageFeedback(result.item, result.count);
          foraged = true;
        } else {
          showForageFeedback('Inventory Full!', 0);
        }
      }
    }
  });
  
  if (!foraged) {
    showForageFeedback('Nothing found here', 0);
  }
}

// --- Visual Feedback System ---
const feedbackParticles = [];

class FeedbackParticle {
  constructor(x, y, text, color) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.life = 1.0;
    this.vy = -40;
  }
  
  update(dt) {
    this.y += this.vy * dt;
    this.life -= dt * 1.5;
    this.vy *= 0.95;
  }
  
  draw(ctx, camera) {
    if (this.life <= 0) return;
    
    const { x: sx, y: sy } = worldToScreen(this.x, this.y);
    
    ctx.save();
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.life;
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(this.text, sx, sy);
    ctx.restore();
  }
}

function showForageFeedback(item, count) {
  const text = count > 0 ? `Found ${item} x${count}` : item;
  const color = count > 0 ? '#4CAF50' : '#ff4444';
  feedbackParticles.push(new FeedbackParticle(player.x, player.y - 30, text, color));
}

function showEatingFeedback(hunger, item) {
  feedbackParticles.push(new FeedbackParticle(player.x, player.y - 30, `+${hunger} hunger`, '#FFC107'));
}

// --- World Data ---
const grid = Array.from({ length: TILE_COUNT }, () => Array(TILE_COUNT).fill(false));
const trees = [];
for (let ty = -12; ty < TILE_COUNT + 12; ty++) {
  for (let tx = -12; tx < TILE_COUNT + 12; tx++) {
    if (Math.random() < 0.015) trees.push({ tx, ty });
  }
}

// --- Circles ---
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

// --- Game Loop ---
let last=performance.now();

function loop(now){
  let dt=(now-last)/1000; last=now; dt=Math.min(dt,MAX_DT);
  update(dt); draw(); requestAnimationFrame(loop);
}

function update(dt){
  // --- Update Forage Areas ---
  forageAreas.forEach(area => area.update(dt));
  
  // --- Update Food Spoilage ---
  playerInventory.updateFoodSpoilage(dt);
  
  // --- Update Feedback Particles ---
  feedbackParticles.forEach(particle => particle.update(dt));
  for (let i = feedbackParticles.length - 1; i >= 0; i--) {
    if (feedbackParticles[i].life <= 0) {
      feedbackParticles.splice(i, 1);
    }
  }
  
  // --- Player Movement ---
  let ax=0, ay=0;
  if(keys['w']||keys['arrowup']) ay--;
  if(keys['s']||keys['arrowdown']) ay++;
  if(keys['a']||keys['arrowleft']) ax--;
  if(keys['d']||keys['arrowright']) ax++;
  if(ax||ay){
  const mag = Math.hypot(ax,ay);
  // --- Sprint input gating ---
  // Track ongoing sprint state (attached to player)
  if (player._wasSprinting === undefined) player._wasSprinting = false;
  let canSprint = false;
  if (keys['shift']) {
    if (!player._wasSprinting) {
      // Initiating sprint
      if (player.stamina >= 10) {
        canSprint = true;
      } else {
        canSprint = false;
      }
    } else {
      // Continuing sprint
      if (player.stamina > 0.5) {
        canSprint = true;
      } else {
        canSprint = false;
      }
    }
  }
  // Update ongoing sprint state
  player._wasSprinting = canSprint;
  const f = ACCEL * (canSprint ? SPRINT_MULT : 1);
  player.vx += (ax/mag)*f*dt;
  player.vy += (ay/mag)*f*dt;
}

  // --- Status Bars Logic (Much Slower Hunger Depletion) ---
  // Hunger rates (per second) - MUCH slower for long-term survival
  const HUNGER_SPRINT = HUNGER_DEPLETION_RATE * 2;
  const HUNGER_RUN = HUNGER_DEPLETION_RATE * 1.5;
  const HUNGER_STILL = HUNGER_DEPLETION_RATE;
  // Health change (per second)
  const HEALTH_LOSS_WHEN_STARVING = 0.1; // Slower health loss
  const HEALTH_REGEN_WHEN_WELLFED = 8; // Slower health regen
  // Stamina change (per second)
  const STAMINA_LOSS_SPRINT = 9;
  const STAMINA_REGEN_IDLE = 9;
  
  // Determine speed
  const speed = Math.hypot(player.vx, player.vy);
  const MOVEMENT_THRESHOLD = 220;
  // Sprinting is allowed only if stamina >= 10% to start, and can't continue if at 0%.
let SPRINTING = false;
if (keys['shift'] && speed > MOVEMENT_THRESHOLD) {
  if (player.stamina > 0) {
    // Can continue sprinting if stamina above 0
    if (player._wasSprinting || player.stamina >= 10) {
      SPRINTING = true;
    }
  }
}
const MOVING = speed > MOVEMENT_THRESHOLD;
// Remember last sprint state for next frame
player._wasSprinting = SPRINTING;

  // Hunger update (much slower)
  if (SPRINTING) {
    player.hunger -= HUNGER_SPRINT * dt;
  } else if (MOVING) {
    player.hunger -= HUNGER_RUN * dt;
  } else {
    player.hunger -= HUNGER_STILL * dt;
  }
  // Clamp hunger
  player.hunger = clamp(player.hunger, 0, 100);

  // Health update
  if (player.hunger <= 0) {
    player.health -= HEALTH_LOSS_WHEN_STARVING * dt;
  } else if (player.hunger > 80) {
    player.health += HEALTH_REGEN_WHEN_WELLFED * dt;
  }
  // Clamp health
  player.health = clamp(player.health, 0, 100);

  // Stamina update
  if (SPRINTING) {
    player.stamina -= STAMINA_LOSS_SPRINT * dt;
  } else if (!MOVING) {
    player.stamina += STAMINA_REGEN_IDLE * dt;
  }  
  // Clamp stamina
  player.stamina = clamp(player.stamina, 0, 100);

  circles.forEach(c=>{ c.vx -= c.vx*DRAG*dt; c.vy -= c.vy*DRAG*dt; c.x += c.vx*dt; c.y += c.vy*dt; });
  for(let i=0;i<circles.length;i++) for(let j=i+1;j<circles.length;j++) resolveCircleCollision(circles[i],circles[j]);
  circles.forEach(c=>{
    if(c.x-c.r<0){ c.x=c.r; c.vx=Math.abs(c.vx)*WALL_RESTITUTION; }
    if(c.x+c.r>WORLD_SIZE){ c.x=WORLD_SIZE-c.r; c.vx=-Math.abs(c.vx)*WALL_RESTITUTION; }
    if(c.y-c.r<0){ c.y=c.r; c.vy=Math.abs(c.vy)*WALL_RESTITUTION; }
    if(c.y+c.r>WORLD_SIZE){ c.y=WORLD_SIZE-c.r; c.vy=-Math.abs(c.vy)*WALL_RESTITUTION; }
    const minX=Math.max(0,Math.floor((c.x-c.r)/TILE_SIZE));
    const maxX=Math.min(TILE_COUNT-1,Math.floor((c.x+c.r)/TILE_SIZE));
    const minY=Math.max(0,Math.floor((c.y-c.r)/TILE_SIZE));
    const maxY=Math.min(TILE_COUNT-1,Math.floor((c.y+c.r)/TILE_SIZE));
    for(let ty=minY;ty<=maxY;ty++) for(let tx=minX;tx<=maxX;tx++) if(grid[ty][tx]) resolveCircleBlock(c,tx,ty);
    trees.forEach(t=> resolveCircleBlock(c,t.tx,t.ty));
  });
  camera.x=player.x; camera.y=player.y;
}

function drawStatusArc(ctx, emoji, value, color, bgColor, x, arcY, emojiY, radius, lw = 12) {
  // Faded background ring (full circle)
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, arcY, radius, 0, 2 * Math.PI);
  ctx.lineWidth = lw;
  ctx.strokeStyle = bgColor;
  ctx.globalAlpha = 0.22;
  ctx.shadowColor = bgColor;
  ctx.shadowBlur = 0;
  ctx.stroke();
  ctx.restore();
  // Foreground arc (current value)
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, arcY, radius, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * (value / 100));
  ctx.lineWidth = lw;
  ctx.strokeStyle = color;
  ctx.globalAlpha = 1.0;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.restore();
  // Draw emoji in center
  ctx.save();
  ctx.font = `${radius}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#111';
  ctx.shadowBlur = 8;
  ctx.globalAlpha = 1.0;
  ctx.fillText(emoji, x, emojiY);
  ctx.restore();
}

function draw(){
  ctx.fillStyle='#1a261a'; ctx.fillRect(0,0,canvas.width,canvas.height);
  if(destroyBlock.active){ const e=(performance.now()-destroyBlock.start)/1000; if(e>=10){ grid[destroyBlock.ty][destroyBlock.tx]=false; destroyBlock.active=false; }}
  if(destroyTree.active){ const e=(performance.now()-destroyTree.start)/1000; if(e>=4){ trees.splice(trees.findIndex(t=>t.tx===destroyTree.tx&&t.ty===destroyTree.ty),1); destroyTree.active=false; }}
  const bx=(0-camera.x)+canvas.width/2;
  const by=(0-camera.y)+canvas.height/2;
  // grid & border
  ctx.strokeStyle='#101a10'; ctx.lineWidth=1; ctx.beginPath();
  for(let i=0;i<=TILE_COUNT;i++){ const x=bx+i*TILE_SIZE; ctx.moveTo(x,by); ctx.lineTo(x,by+WORLD_SIZE); }
  for(let j=0;j<=TILE_COUNT;j++){ const y=by+j*TILE_SIZE; ctx.moveTo(bx,y); ctx.lineTo(bx+WORLD_SIZE,y); }
  ctx.stroke();
  ctx.strokeStyle='#0c150c'; ctx.lineWidth=4; ctx.strokeRect(bx,by,WORLD_SIZE,WORLD_SIZE);
  // hover outline
  const hover=screenToTile(mouse.x,mouse.y);
  if(inBounds(hover.tx,hover.ty) && inRange(hover.tx,hover.ty,player.tileX,player.tileY,4)
     && !grid[hover.ty][hover.tx]
     && !trees.find(t=>t.tx===hover.tx&&t.ty===hover.ty)
     && !circles.some(c=>Math.floor(c.x/TILE_SIZE)===hover.tx&&Math.floor(c.y/TILE_SIZE)===hover.ty)) {
    const {x:hx,y:hy}=worldToScreen(hover.tx*TILE_SIZE,hover.ty*TILE_SIZE);
    ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=2;
    ctx.strokeRect(hx,hy,TILE_SIZE,TILE_SIZE);
  }
  // trees
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font=`${TILE_SIZE}px serif`;
  trees.forEach(t=>{
    const wx=t.tx*TILE_SIZE+TILE_SIZE/2;
    const wy=t.ty*TILE_SIZE+TILE_SIZE/2;
    const {x:sx,y:sy}=worldToScreen(wx,wy);
    ctx.fillText('🌲',sx,sy);
  });
  // blocks
  for(let y=0;y<TILE_COUNT;y++) for(let x=0;x<TILE_COUNT;x++) if(grid[y][x]){
    const wpx=x*TILE_SIZE, wpy=y*TILE_SIZE;
    const {x:sx,y:sy}=worldToScreen(wpx,wpy);
    ctx.fillStyle='#333'; ctx.fillRect(sx,sy,TILE_SIZE,TILE_SIZE);
    ctx.strokeStyle='#4d4d4d'; ctx.lineWidth=2; ctx.strokeRect(sx,sy,TILE_SIZE,TILE_SIZE);
  }
  
  // --- Forage Areas ---
  forageAreas.forEach(area => area.draw(ctx, camera));
  
  // circles
  circles.forEach(c=>{
    const {x:sx,y:sy}=worldToScreen(c.x,c.y);
    ctx.beginPath(); ctx.arc(sx,sy,c.r,0,Math.PI*2);
    ctx.fillStyle=c.isPlayer?'#4caf50':'#2196f3'; ctx.fill();
  });
  
  // --- Feedback Particles ---
  feedbackParticles.forEach(particle => particle.draw(ctx, camera));
  
  // destruction indicators
  function drawIndicator(info,dur){
    const p=Math.min((performance.now()-info.start)/1000/dur,1);
    const cx=info.tx*TILE_SIZE+TILE_SIZE/2;
    const cy=info.ty*TILE_SIZE+TILE_SIZE/2;
    const {x:sx,y:sy}=worldToScreen(cx,cy);
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.moveTo(sx,sy);
    ctx.arc(sx,sy,TILE_SIZE/2,-Math.PI/2,-Math.PI/2+2*Math.PI*p);
    ctx.closePath(); ctx.fill();
  }
  if(destroyBlock.active) drawIndicator(destroyBlock,10);
  if(destroyTree.active) drawIndicator(destroyTree,4);

  // --- Status Radial Indicators ---
  const arcRadius = 27;
  const arcWidth = 8;
  const arcSpacing = 70;
  const margin = 18;
  const y = canvas.height - arcRadius - margin;
  const x = arcRadius + margin;
  const arcYOffset = -3;

  // Health
  drawStatusArc(ctx, '❤️', player.health, '#a83232', '#6e2323', x, y + arcYOffset, y, arcRadius, arcWidth);
  // Stamina
  const x2 = x + arcSpacing;
  drawStatusArc(ctx, '🔋', player.stamina, '#318b48', '#25402d', x2, y + arcYOffset, y, arcRadius, arcWidth);
  // Hunger
  const x3 = x + arcSpacing * 2;
  drawStatusArc(ctx, '🍗', player.hunger, '#bf7e1a', '#6e481c', x3, y + arcYOffset, y, arcRadius, arcWidth);
  
  // --- Forage Indicator ---
  const forageIndicator = document.getElementById('forage-indicator');
  let canForage = false;
  forageAreas.forEach(area => {
    const distance = Math.hypot(player.x - area.x, player.y - area.y);
    if (distance < FORAGE_RANGE && area.canForage()) {
      canForage = true;
    }
  });
  forageIndicator.style.display = canForage ? 'block' : 'none';
}

// --- Inventory Event Listeners ---
document.getElementById('close-inventory').addEventListener('click', toggleInventory);

// Initialize forage areas
initializeForageAreas();

// Start the game
requestAnimationFrame(loop);