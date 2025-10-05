// --- Loop ---
let last=performance.now();
function loop(now){
  let dt=(now-last)/1000; last=now; dt=Math.min(dt,MAX_DT);
  update(dt); draw(); requestAnimationFrame(loop);
}
function update(dt){
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


  // --- Status Bars Logic ---
  // Hunger rates (per second)
  const HUNGER_SPRINT = 0.25;
  const HUNGER_RUN = 0.20;
  const HUNGER_STILL = 0.10;
  // Health change (per second)
  const HEALTH_LOSS_WHEN_STARVING = 0.25;
  const HEALTH_REGEN_WHEN_WELLFED = 15;
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

  // Hunger update
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

function drawStatusArc(ctx, emoji, value, color, bgColor, x, y, radius, lw = 12) {
  // Faded background ring (full circle)
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
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
  ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * (value / 100));
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
  ctx.fillText(emoji, x, y);
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
  // circles
  circles.forEach(c=>{
    const {x:sx,y:sy}=worldToScreen(c.x,c.y);
    ctx.beginPath(); ctx.arc(sx,sy,c.r,0,Math.PI*2);
    ctx.fillStyle=c.isPlayer?'#4caf50':'#2196f3'; ctx.fill();
  });
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
  // Larger, more spaced, arc offset up 6px from emoji center
  const arcRadius = 27;
  const arcWidth = 8;
  const arcSpacing = 70;
  const margin = 18;
  const y = canvas.height - arcRadius - margin;
  const x = arcRadius + margin;
  const arcYOffset = -3; // arc is drawn slightly above emoji

  // Update drawStatusArc to accept separate emojiY and arcY
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
  // Health
  drawStatusArc(ctx, '❤️', player.health, '#a83232', '#6e2323', x, y + arcYOffset, y, arcRadius, arcWidth);
  // Stamina
  const x2 = x + arcSpacing;
  drawStatusArc(ctx, '🔋', player.stamina, '#318b48', '#25402d', x2, y + arcYOffset, y, arcRadius, arcWidth);
  // Hunger
  const x3 = x + arcSpacing * 2;
  drawStatusArc(ctx, '🍗', player.hunger, '#bf7e1a', '#6e481c', x3, y + arcYOffset, y, arcRadius, arcWidth);


  }
  requestAnimationFrame(loop);

  // #### end of page 2 ####



