// Audio-Enhanced Verbal Memory Game
// Includes satisfying procedural sounds that match the game's design vibe

// --- Grid and Responsiveness ---
function getGridConfig() {
  if (window.innerWidth <= 600 || window.innerHeight <= 600) {
    return { cols: 3, rows: 5 };
  }
  return { cols: 5, rows: 3 };
}

function isVerticalMode() {
  const cfg = getGridConfig();
  return cfg.rows > cfg.cols;
}

function updateGrid() {
  const grid = document.getElementById('grid');
  const margin = 8;
  grid.innerHTML = '';
  const { cols, rows } = getGridConfig();
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  grid.style.gap = margin + 'px';
  const bar = document.querySelector('.status-bar');
  const availableWidth = window.innerWidth - 2 * margin;
  const availableHeight = window.innerHeight - bar.offsetHeight - 2 * margin;
  const cellWidth = (availableWidth - (cols - 1) * margin) / cols;
  const cellHeight = (availableHeight - (rows - 1) * margin) / rows;
  const squareSize = Math.floor(Math.min(cellWidth, cellHeight));
  grid.style.width = (squareSize * cols + (cols - 1) * margin) + 'px';
  grid.style.height = (squareSize * rows + (rows - 1) * margin) + 'px';
  for (let i = 0; i < cols * rows; i++) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.style.width = squareSize + 'px';
    tile.style.height = squareSize + 'px';
    tile.dataset.index = i;
    grid.appendChild(tile);
  }
}

// --- Overlay, Timer, and Round Logic ---
let timerInterval = null;
let timerSeconds = 60;
let round = 1;

function updateTimerDisplay() {
  const timer = document.getElementById('timer');
  const min = Math.floor(timerSeconds / 60);
  const sec = timerSeconds % 60;
  timer.querySelector('span').textContent =
    min + ':' + (sec < 10 ? '0' : '') + sec;
  
  // Play subtle timer tick sound
  if (audioSystem && timerSeconds <= 10 && timerSeconds > 0) {
    audioSystem.playTimerTick();
  }
}

function updateRoundDisplay() {
  document.getElementById('round').querySelector('span:last-child').textContent = round;
  triggerGlow('round');
  
  // Play round complete sound
  if (audioSystem && round > 1) {
    audioSystem.playRoundComplete();
  }
}

// ----- SCORING AND STRIKES -----
let score = 0;
let strikes = 0;

function triggerGlow(id) {
  // Special case for strikes: apply to all X's
  if (id === 'strikes') {
    const xs = document.querySelectorAll('#strikes .strike-x');
    xs.forEach(el => {
      el.classList.remove('glow');
      void el.offsetWidth;
      el.classList.add('glow');
    });
  } else {
    // For all others: only value span
    const el = document.getElementById(id).querySelector('span:last-child');
    if (!el) return;
    el.classList.remove('glow');
    void el.offsetWidth;
    el.classList.add('glow');
  }
}

function updateScoreDisplay() {
  document.getElementById('score').querySelector('span:last-child').textContent = score;
  triggerGlow('score');
}

function updateStrikesDisplay() {
  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById(`strike${i}`);
    if (i <= strikes) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  }
}

function resetScoreAndStrikes() {
  score = 0;
  strikes = 0;
  updateScoreDisplay();
  updateStrikesDisplay();
}

function incrementStrike() {
  strikes += 1;
  updateStrikesDisplay();
  triggerGlow('strikes');
  
  // Play strike sound
  if (audioSystem) {
    audioSystem.playStrike();
  }
  
  if (strikes >= 3) {
    showGameOverOverlay();
  }
}

function incrementScore() {
  score += 1;
  updateScoreDisplay();
  
  // Play score increase sound
  if (audioSystem) {
    audioSystem.playScoreIncrease();
  }
}

function startGame() {
  const overlay = document.getElementById('startOverlay');
  overlay.classList.add('hide');
  setTimeout(() => {
    overlay.style.display = 'none';
  }, 200);
  
  // Initialize audio system on first user interaction
  if (!audioSystem) {
    audioSystem = initAudioSystem();
  }
  
  timerSeconds = 60;
  updateTimerDisplay();
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timerSeconds--;
    updateTimerDisplay();
    if (timerSeconds <= 0) {
      round++;
      updateRoundDisplay();
      timerSeconds = 60;
      updateTimerDisplay();
      triggerGlow('timer');
    }
  }, 1000);

  resetScoreAndStrikes();
  startWordSpawning();
}

function showStartOverlay() {
  const overlay = document.getElementById('startOverlay');
  const instr = document.getElementById('startInstructions');
  overlay.classList.remove('hide');
  overlay.style.display = 'flex';
  overlay.focus();

  let msg;
  if ('ontouchstart' in window) {
    msg = 'Long-tap NEW words.\nShort-tap SEEN words.\nTap to start.';
  } else {
    msg = 'Left-click NEW words.\nRight-click SEEN words.\nClick to start.';
  }
  instr.textContent = msg;
}

function showGameOverOverlay() {
  // Stop timers and clear the board
  if (timerInterval) clearInterval(timerInterval);
  stopWordSpawning();
  clearAllWordTiles();

  // Play game over sound
  if (audioSystem) {
    audioSystem.playGameOver();
  }

  const overlay = document.getElementById('gameOverOverlay');
  const instr = document.getElementById('gameOverInstructions');
  overlay.style.display = 'flex';
  overlay.classList.remove('hide');

  // Detect device for instructions
  let playAgainText;
  if ('ontouchstart' in window) {
    playAgainText = "Tap to play again.";
  } else {
    playAgainText = "Click to play again.";
  }

  instr.textContent =
    `Game Over\n\nScore: ${score}\nUnique Words: ${seenWords.size}\nLast Round: ${round}\n\n${playAgainText}`;

  // --- 600ms block for input ---
  let inputBlocked = true;
  setTimeout(() => {
    inputBlocked = false;
  }, 600);

  function handler(e) {
    if (inputBlocked) return;
    e.preventDefault();
    overlay.classList.add('hide');
    setTimeout(() => { overlay.style.display = 'none'; }, 200);
    detach();
    resetForStartOverlay();
    showAndHandleStartOverlay();
  }
  function detach() {
    overlay.removeEventListener('mousedown', handler);
    overlay.removeEventListener('touchstart', handler);
    overlay.removeEventListener('keydown', keyHandler);
  }
  function keyHandler(e) {
    if (inputBlocked) return;
    if (e.code === 'Space' || e.code === 'Enter') {
      handler(e);
    }
  }
  overlay.addEventListener('mousedown', handler);
  overlay.addEventListener('touchstart', handler, { passive: false });
  overlay.addEventListener('keydown', keyHandler);
  overlay.focus();
}

function startOverlayHandler(e) {
  e.preventDefault();
  startGame();
  detachStartOverlayHandlers();
}

function attachStartOverlayHandlers() {
  const overlay = document.getElementById('startOverlay');
  overlay.addEventListener('mousedown', startOverlayHandler);
  overlay.addEventListener('touchstart', startOverlayHandler, { passive: false });
  overlay.addEventListener('keydown', overlayKeydownHandler);
  overlay.focus();
}

function detachStartOverlayHandlers() {
  const overlay = document.getElementById('startOverlay');
  overlay.removeEventListener('mousedown', startOverlayHandler);
  overlay.removeEventListener('touchstart', startOverlayHandler);
  overlay.removeEventListener('keydown', overlayKeydownHandler);
}

function overlayKeydownHandler(e) {
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    startGame();
    detachStartOverlayHandlers();
  }
}

function resetForStartOverlay() {
  if (timerInterval) clearInterval(timerInterval);
  stopWordSpawning();
  timerSeconds = 60;
  round = 1;
  updateTimerDisplay();
  updateRoundDisplay();
  clearAllWordTiles();
  resetScoreAndStrikes();
}

function showAndHandleStartOverlay() {
  showStartOverlay();
  attachStartOverlayHandlers();
}

window.addEventListener('resize', () => {
  clearAllWordTiles();
  updateGrid();
  const overlay = document.getElementById('startOverlay');
  if (overlay && overlay.style.display !== 'none') {
    showStartOverlay();
  }
});

window.addEventListener('DOMContentLoaded', () => {
  updateGrid();
  resetForStartOverlay();
  showAndHandleStartOverlay();
});

// --- WORD SPAWN LOGIC + RADIAL SWEEP OVERLAY ---
const WORD_BANK = ["adventure", "airport", "airline", "aisle", "alley", "altitude", "amusement", "atlas", "avenue", "backpack", "bag", "baggage", "balcony", "bar", "beach", "bed", "boarding", "border", "boutique", "breeze", "bridge", "buffet", "bungalow", "bus", "cabin", "cafe", "camera", "camp", "canal", "caravan", "cargo", "carriage", "cart", "catamaran", "cave", "checklist", "city", "cliff", "cloud", "coach", "coast", "compass", "concierge", "continent", "corridor", "cruise", "culture", "currency", "customs", "deck", "departure", "detour", "dock", "dome", "drift", "drive", "embassy", "embark", "enroute", "escape", "excursion", "explorer", "express", "fare", "festival", "ferry", "fiesta", "flight", "flora", "footpath", "fortress", "fountain", "freeway", "frontier", "frost", "gallery", "gateway", "glacier", "globe", "gondola", "guide", "harbor", "hike", "hill", "holiday", "hostel", "hotel", "hut", "inn", "island", "itinerary", "jet", "jetty", "journey", "jungle", "kayak", "kayaking", "key", "landmark", "lane", "lodge", "luggage", "luxury", "map", "market", "marina", "metro", "mile", "minibus", "minivan", "mission", "monastery", "monument", "mosque", "mountain", "museum", "nature", "oasis", "odyssey", "outback", "overlook", "package", "palace", "passport", "path", "pavement", "peak", "pier", "pilgrim", "pilot", "plane", "plaza", "port", "postcard", "pouch", "quay", "quest", "railway", "ranger", "resort", "rest", "retreat", "ridge", "river", "road", "roam", "route", "rowboat", "ruin", "safari", "sail", "sailing", "sanctuary", "scenery", "scuba", "seaside", "shrine", "shore", "shuttle", "sidewalk", "ski", "slope", "snorkel", "souvenir", "spa", "station", "steeple", "stopover", "street", "subway", "suite", "summit", "sunrise", "sunset", "surf", "surfer", "suitcase", "synagogue", "taxi", "temple", "ticket", "tide", "tour", "tourist", "tower", "track", "trail", "train", "tram", "transit", "travel", "trek", "trip", "trolley", "tunnel", "unpack", "vacation", "valley", "van", "vessel", "view", "villa", "visa", "voyage", "walk", "wander", "waterfall", "wayfarer", "windmill", "window", "yacht", "zodiac", "adobe", "alpine", "arch", "auberge", "bay", "bazaar", "berth", "bike", "canyon", "car", "carpool", "carter", "cathedral", "chalet", "charter", "climate", "cove", "crag", "custom", "desert", "dune", "escapade", "fauna", "fjord", "flier", "foyer", "gazebo", "gorge", "grotto", "guidebook", "hammock", "hamlet", "heritage", "horizon", "host", "houseboat", "jetliner", "junction", "knapsack", "landscape", "lantern", "locale", "lodging", "mainland", "meadow", "motel", "mount", "outpost", "overpass", "paradise", "parlor", "pathway", "pension", "pergola", "piazza", "pontoon", "promenade", "quaint", "quicksand", "rambler", "reception", "refuge", "residence", "roadster", "rover", "runway", "sanctum", "seaway", "shack", "shoreline", "sight", "sleepover", "sojourn", "stop", "streetcar", "sunroof", "swamp", "tavern", "trailhead", "tramway", "traverse", "trekker", "tribe", "tripper", "tropic", "tundra", "turnstile", "upland", "valise", "vista", "voyager", "way", "wharf", "wheeler", "wing", "yurt", "activity", "facility", "invisible", "notorious", "miserable", "evolution", "operation", "humanity", "execution", "enfix", "ambiguous", "publicity", "available", "photocopy", "intensify", "executive", "unanimous", "majority", "authority", "emergency", "directory", "eliminate", "confusion", "detective", "effective", "unlawful", "critical", "explosion", "tragedy", "flexible", "circulate", "episode", "pollution", "officer", "agency", "condition", "quantity", "unlikely", "entertain", "rotation", "reactor", "tropical", "genuine", "physical", "amputate", "predator", "skeleton", "medieval", "embryo", "terrify", "sacrifice", "implicit", "minimize", "guarantee", "dominate", "industry", "elegant", "official", "dilemma", "calorie", "weakness", "wire", "excess", "novel", "honor", "result", "mixture", "teacher", "refund", "glasses", "concern", "infect", "dairy", "fragrant", "notice", "fuel", "ample", "feedback", "finance", "portion", "forward", "inspire", "council", "morsel", "arrange", "practice", "curtain", "athlete", "cater", "kettle", "extent", "dictate", "refuse", "barrel", "packet", "opera", "fashion", "review", "attract", "merchant", "picture", "clinic", "eject", "suggest", "lazy", "balance", "moving", "verdict", "ideology", "earthflax", "earthwax", "liability", "ambiguity", "diameter", "scenario", "hierarchy", "memorial", "temporary", "society", "deviation", "ordinary", "apology", "biography", "economy", "auditor", "property", "ecstasy", "benefit", "seminar", "producer", "exclusive", "battery", "asylum", "willpower", "undertake", "disaster", "funeral", "nominate", "loyalty", "falsify", "origin", "linear", "feminist", "agenda", "cylinder", "alcohol", "radical", "abundant", "direction", "talkative", "retailer", "recording", "reduction", "inflation", "indirect", "realize", "exemption", "reliance", "analysis", "category", "structure", "function", "processes", "strategy", "argument", "criteria", "operator", "elemental", "terminal", "logical", "database", "semantic", "evidence", "relevant", "syllable", "possible", "solution", "variable", "multiple", "analytic", "integral", "definite", "entity", "numeric", "primary", "secondary", "tertiary", "relative", "absolute", "adequate", "optimum", "optical", "abstract", "dynamic", "algorithm", "diagram", "formulaic", "accuracy", "elegance", "general", "integrate", "interval", "judgment", "judicial", "language", "magnetic", "material", "mechanic", "modeling", "optimal", "practical", "priority", "probable", "protocol", "reliable", "sequence", "standard", "statistic", "suitable", "symbolic", "systemic", "tactical", "theorem", "theorist", "theorize", "typical", "universal", "vertical", "virtual", "auditory", "behavior", "calculate", "chemical", "cognitive", "component", "compound", "concrete", "conductor", "conscious", "consensus", "construct", "consumer", "describe", "detailed", "digitize", "elastic", "emphasis", "evaluate", "explicit", "factorial", "formalize", "generate", "generic", "graphical", "hardware", "heuristic", "identity", "inherent", "insight", "invariant", "linguist", "matrixes", "mediate", "minimal", "modular", "mutually", "natural", "negative", "neutral", "notional", "outline", "paradigm", "parallel", "parameter", "particle", "patterned", "periodic", "plausible", "positive", "precise", "predict", "premise", "presume", "process", "product", "profiled", "program", "propose", "qualify", "quantify", "randomly", "rational", "refined", "regular", "resolve", "response", "reversal", "schema", "section", "segment", "simulate", "specimen", "spectrum", "subject", "unbiased", "voltage", "activate", "adjusted", "aggregate", "assemble", "assisted", "attribute", "combine", "compare", "complex", "concept", "condense", "condoned", "confirm", "conflict", "conform", "connect", "conserve", "consider", "constant", "contain", "content", "context", "control", "convert", "converse", "coordin", "crucial", "default", "define", "deliver", "density", "dialogue", "digital", "directly", "discrete", "display", "distingu", "divided", "element", "enforce", "enhance", "equation", "examine", "exclude", "exhibit", "explore", "exposure", "external", "feature", "filtering", "focused", "formula", "gradient", "graphite", "guideline", "implied", "improve", "include", "inference", "inputted", "inspect", "integer", "interest", "internal", "involve", "iterate", "monitor", "objective", "observe", "iteration", "nonlinear", "anxious", "anger", "barrier", "beauty", "believe", "betrayal", "bitterly", "breathe", "bravery", "burdened", "caringly", "causing", "certain", "charming", "cheerful", "clarity", "comfort", "conceal", "confuse", "courage", "curious", "darkness", "daydream", "defiant", "deflated", "delight", "desire", "despair", "devoted", "diffuse", "dignity", "disgust", "dismay", "disturb", "dreamer", "dreading", "drained", "dreadful", "eagerly", "elevate", "embrace", "emotion", "empathy", "envious", "essence", "esteem", "euphoria", "evasion", "excited", "fantasy", "feeling", "fearing", "forgive", "forlorn", "freedom", "frenzied", "friend", "frustrate", "futility", "gloomy", "gorgeous", "grateful", "grieving", "guiltless", "harmony", "haunted", "heartache", "helpless", "hesitant", "hopeful", "hostile", "humble", "humbled", "humored", "hysteria", "illusive", "imagine", "impulse", "indulge", "infamous", "insecure", "insulted", "intense", "intuition", "isolate", "jealousy", "jovially", "justice", "laughter", "leisure", "liberty", "lonelier", "lovable", "madness", "malice", "mania", "meaning", "merciful", "mindful", "miracle", "miserly", "modesty", "mournful", "mystery", "naivete", "nervous", "nobility", "nostalgic", "offended", "opinion", "optimist", "outrage", "painful", "panicky", "paranoia", "passion", "patient", "peaceful", "penitent", "pensive", "perceive", "perilous", "pleasure", "powerful", "precious", "prejudice", "private", "promise", "provoke", "prudence", "punitive", "puzzling", "radiant", "reaction", "rebelled", "rejected", "relieved", "remorse", "repulse", "resented", "respect", "reverie", "romantic", "sadness", "sanguine", "scornful", "securely", "selfish", "sensitive", "serenity", "shameful", "shyness", "sincere", "sociable", "solitude", "sorrowful", "spiteful", "stubborn", "suffered", "support", "surprise", "sympathy", "tangible", "tearful", "temperate", "tenacity", "tenderly", "tension", "therapy", "threaten", "thrilled", "tranquil", "treasure", "trepid", "troubled", "trusting", "unaware", "uncaring", "uncertain", "unhappy", "unique", "unrest", "upset", "urgency", "valor", "vanity", "victim", "vicious", "vigorous", "vindicate", "violent", "virtue", "vision", "volatile", "warmth", "warrior", "wearily", "welcome", "whimsy", "wistful", "wondrous", "worried", "wounded", "zealous", "yearning", "youthful", "yielding", "zealotry", "alienate", "amazement", "animated", "apathetic", "approval", "asserted", "attitude", "aversion", "awkward", "bewilder", "blessing", "boldness", "broken", "calming", "candor", "cautious", "cherish", "complain", "confide", "contrite", "convince", "cope", "craving", "crushed", "curiosity", "devotion", "distress", "dreamy", "ecstatic", "fearful", "fervent", "fragile", "frighten", "humility", "agitation", "overwhelm", "velvet", "marble", "silken", "pillow", "velour", "rubber", "lemon", "honey", "butter", "cushion", "cotton", "candle", "cobweb", "petals", "glassy", "hollow", "sticky", "sandy", "glossy", "leaves", "gritty", "mulch", "pebble", "tickle", "brittle", "paddle", "ripple", "puddle", "lather", "ginger", "hazel", "smooth", "frigid", "crackle", "thistle", "syrupy", "dapple", "sable", "bristle", "jagged", "snappy", "sizzle", "crunch", "spongy", "squishy", "woolen", "fluffy", "coarse", "slimy", "pasty", "crispy", "misty", "bubble", "flicker", "soapy", "softer", "firmer", "chilly", "throbbing", "dimple", "drizzle", "darker", "warmer", "shadow", "musty", "clammy", "chalky", "frosty", "scratch", "twisty", "clumpy", "spicy", "tender", "muddy", "mossy", "bumpy", "poppy", "frisky", "bouncy", "cuddle", "wheaty", "grassy", "shiver", "pepper", "chewy", "slushy", "squirm", "pulses", "drippy", "rumble", "cradle", "cloudy", "silky", "puffy", "creamy", "zesty", "foggy", "sultry", "swampy", "wiggle", "frilly", "wispy", "tingle", "drowsy", "fuzzy", "nutty", "peachy", "woody", "milky", "minty", "brassy", "briny", "dusky", "plump", "mushy", "soggy", "lacy", "tremor", "powder", "crumbs", "crusty", "soften", "sloppy", "leafy", "gentle", "balloon", "whistle", "puff", "giggle", "zap", "pop", "twirl", "blink", "bop", "squiggle", "bounce", "boing", "sproing", "wig", "mischief", "splat", "smirk", "pow", "kaboom", "whoosh", "zoom", "fizz", "clown", "juggle", "parade", "jiggle", "flop", "swoosh", "slide", "glimmer", "sparkle", "glow", "swirl", "doodle", "scribble", "crayon", "wobble", "zany", "fumble", "bloop", "twinkle", "stripe", "patch", "plop", "crash", "bash", "twist", "slip", "slap", "wink", "grin", "snicker", "snort", "prank", "puzzle", "sneeze", "chomp", "snap", "fizzle", "cape", "mask", "shoes", "button", "pocket", "umbrella", "storm", "sunbeam", "rainbow", "plush", "critter", "beak", "paw", "tail", "fin", "snout", "trumpet", "squeak", "roar", "meow", "woof", "chirp", "buzz", "ribbit", "croak", "bark", "howl", "hoot", "skedaddle", "skitter", "scurry", "scoot", "prance", "trot", "hop", "skip", "stomp", "shuffle", "mumble", "hum", "sing", "chant", "beep", "honka", "vroom", "munch", "gulp", "nibble", "chew", "chuckle", "guffaw", "belly", "tumble", "cartwheel", "pirouette", "leap", "vault", "spin", "dizzy", "knock", "thud", "gurgle", "splash", "drip", "drop", "plunk", "ding", "dong", "clang", "tinkle", "clatter", "rattle", "jingling", "whoopee", "cheery", "giddy", "zippy", "loony", "jolly", "quirky", "peppy", "glee", "cheeky", "draw", "color", "ink", "paint", "canvas", "palette", "patchwork", "ragtag", "zigzag", "polka", "dot", "blob", "mosaic", "tile", "sticker", "badge", "label", "tag", "crest", "emblem", "bowtie", "necklace", "crown", "topper", "tiara", "wand", "magic", "spell", "curse", "charm", "luck", "wish", "dream", "myth", "legend", "tale", "story", "chapter", "page", "script", "scene", "frame", "cell", "panel", "strip", "sheet", "sketch", "shape", "form", "block", "cube", "sphere", "cone", "prism", "castle", "scooter", "skate", "sled", "rocket", "spaceship", "planet", "star", "moon", "comet", "asteroid", "satellite", "galaxy", "cosmos", "universe", "time", "clock", "tick", "tock", "calendar", "season", "spring", "summer", "fall", "winter", "ice", "snow", "flake", "igloo", "penguin", "polar", "blizzard", "flurry", "melt", "thaw", "sun", "shine", "beam", "ray", "dawn", "twilight", "midnight", "shade", "gleam", "flash", "flick"];

// --- Only this Set persists through the game, and keeps track of "seen" words
let seenWords = new Set();
let wordSpawnsCount = 0;
let spawnTimers = [];

function getCurrentWordsOnBoard() {
  const tiles = getAllTiles();
  let words = [];
  for (const tile of tiles) {
    const overlay = tile.querySelector('.tile-word-overlay');
    if (overlay && overlay._word) {
      words.push(overlay._word);
    }
  }
  return words;
}

// --- Pick logic with 53% new, and never duplicate on screen ---
function pickWordNoDuplicates() {
  const wordsOnBoard = getCurrentWordsOnBoard();
  let newWordChance = Math.min(0.89, 0.53 + 0.03 * (round - 1)); // (max newWordChance, startingNewWordChance + roundIncrementToChance * round
  if (wordSpawnsCount < 3) {
    const unseen = WORD_BANK.filter(w => !seenWords.has(w) && !wordsOnBoard.includes(w));
    if (unseen.length === 0) return null;
    const w = unseen[Math.floor(Math.random() * unseen.length)];
    // Mark as seen for future spawns
    seenWords.add(w);
    return { word: w, isNew: true };
  }
  if (Math.random() < newWordChance) {
    const unseen = WORD_BANK.filter(w => !seenWords.has(w) && !wordsOnBoard.includes(w));
    if (unseen.length > 0) {
      const w = unseen[Math.floor(Math.random() * unseen.length)];
      seenWords.add(w);
      return { word: w, isNew: true };
    }
    // If no new words, will fallback to repeat below
  }
  const availableSeen = Array.from(seenWords).filter(w => !wordsOnBoard.includes(w));
  if (availableSeen.length === 0) return null;
  const w = availableSeen[Math.floor(Math.random() * availableSeen.length)];
  // This is NOT new (is repeat)
  return { word: w, isNew: false };
}

function createRadialSweepOverlay(durationSec) {
  const overlay = document.createElement('div');
  overlay.className = 'tile-word-overlay';
  overlay.style.position = 'absolute';
  overlay.style.inset = 0;
  overlay.style.background = 'none';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = 2;
  overlay.style.pointerEvents = 'auto';

  // Place a canvas for the radial sweep
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.zIndex = 2;
  overlay.appendChild(canvas);

  // Word text div
  const wordDiv = document.createElement('div');
  wordDiv.className = 'tile-word-text';
  wordDiv.style.position = 'relative';
  wordDiv.style.zIndex = 3;
  wordDiv.style.color = '#e9f0ff';
  wordDiv.style.fontWeight = 'bold';
  wordDiv.style.fontSize = '1.17em';
  wordDiv.style.textShadow = '0 2px 12px #101010cc, 0 0 6px #26317a80';
  wordDiv.style.maxWidth = '90%';
  wordDiv.style.maxHeight = '80%';
  wordDiv.style.display = 'flex';
  wordDiv.style.alignItems = 'center';
  wordDiv.style.justifyContent = 'center';
  wordDiv.style.textAlign = 'center';
  wordDiv.style.overflow = 'hidden';
  wordDiv.style.wordBreak = 'break-word';
  wordDiv.style.whiteSpace = 'nowrap';

  overlay.appendChild(wordDiv);

  // Animate the radial sweep (circle only, no dim)
  let start = null;
  let requestId = null;
  function animateSweep(ts) {
    if (!start) start = ts;
    const elapsed = (ts - start) / 1000;
    const percent = Math.min(elapsed / durationSec, 1);
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - 7;
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    ctx.globalAlpha = 0.83;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, -Math.PI/2, -Math.PI/2 + percent*2*Math.PI, false);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fillStyle = "#22293d";
    ctx.shadowColor = "#131822a0";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2*Math.PI, false);
    ctx.strokeStyle = "#657ae8";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#29305d";
    ctx.shadowBlur = 3;
    ctx.stroke();
    ctx.restore();

    if (percent < 1) {
      requestId = requestAnimationFrame(animateSweep);
    }
  }

  overlay._startSweep = () => {
    start = null;
    requestId = requestAnimationFrame(animateSweep);
  };
  overlay._stopSweep = () => {
    if (requestId) cancelAnimationFrame(requestId);
  };

  function fitText(div) {
    let parent = div.parentNode;
    if (!parent) return;
    let size = 36; // px, or start larger if your tiles are big
    div.style.fontSize = size + 'px';
    div.style.whiteSpace = 'nowrap'; // ensure one line!
    let fits = () => div.scrollWidth <= parent.offsetWidth * 0.80;
    while (!fits() && size > 10) {
      size -= 1;
      div.style.fontSize = size + 'px';
    }
  }

  overlay.setWord = (w, isNew) => {
    wordDiv.textContent = (w || '').toUpperCase();
    overlay._word = w;
    overlay._isNew = isNew;
    // Wait for DOM update, then fit
    setTimeout(() => fitText(wordDiv), 0);
  };

  return overlay;
}

function getAllTiles() {
  return Array.from(document.querySelectorAll('.tile'));
}

function getAvailableTileIndices() {
  return getAllTiles().map((tile, i) => tile.querySelector('.tile-word-overlay') ? null : i)
                      .filter(i => i !== null);
}

function clearAllWordTiles() {
  getAllTiles().forEach(tile => {
    const overlay = tile.querySelector('.tile-word-overlay');
    if (overlay) {
      overlay._stopSweep && overlay._stopSweep();
      tile.removeChild(overlay);
    }
    // Remove any feedback text as well!
    const feedback = tile.querySelector('.tile-feedback');
    if (feedback) feedback.remove();
  });
  spawnTimers.forEach(x => clearTimeout(x));
  spawnTimers = [];
}

function spawnWordInRandomTile() {
  const availIndices = getAvailableTileIndices();
  if (availIndices.length === 0) return;
  const pick = pickWordNoDuplicates();
  if (!pick) return;
  const { word, isNew } = pick;

  const idx = availIndices[Math.floor(Math.random() * availIndices.length)];
  const tile = getAllTiles()[idx];
  tile.style.position = 'relative';

  const duration = Math.max(5, 15 - (round - 1)); // Decreases 1s per round, min 5s
  const overlay = createRadialSweepOverlay(duration);
  overlay.setWord(word, isNew);

  attachWordInputHandlers(overlay, word);

  tile.appendChild(overlay);
  overlay._startSweep();

  // Play word spawn sound
  if (audioSystem) {
    audioSystem.playWordSpawn();
  }

  const t = setTimeout(() => {
    overlay._stopSweep();
    if (overlay.parentNode === tile) {
      showTileFeedback(tile, 'Timed Out', false);
      tile.removeChild(overlay);
      incrementStrike();
    }
  }, duration * 1000);

  spawnTimers.push(t);
  wordSpawnsCount++;
}

function scheduleNextWordSpawn() {
  if (!wordSpawningActive) return;
  const minInterval = 800; // 0.8s
  const maxInterval = 3200; // 3.2s
  const randInterval = Math.random() * (maxInterval - minInterval) + minInterval;
  spawnTimers.push(setTimeout(() => {
    spawnWordInRandomTile();
    scheduleNextWordSpawn();
  }, randInterval));
}

let wordSpawningActive = false;
function startWordSpawning() {
  wordSpawningActive = true;
  seenWords = new Set();
  wordSpawnsCount = 0;
  scheduleNextWordSpawn();
}

function stopWordSpawning() {
  wordSpawningActive = false;
  spawnTimers.forEach(x => clearTimeout(x));
  spawnTimers = [];
}

// ---- INPUT HANDLING ----
function removeOverlayFromTile(overlay) {
  if (!overlay) return;
  overlay._stopSweep && overlay._stopSweep();
  if (overlay.parentNode) {
    overlay.parentNode.style.position = '';
    overlay.parentNode.removeChild(overlay);
  }
}

function showTileFeedback(tile, message, isGood) {
  // Remove any old feedback on the tile
  const old = tile.querySelector('.tile-feedback');
  if (old) old.remove();

  const div = document.createElement('div');
  div.className = 'tile-feedback ' + (isGood ? 'green' : 'red');
  div.textContent = message;
  tile.appendChild(div);

  // Remove after animation completes
  div.addEventListener('animationend', () => {
    div.remove();
  });
}

function attachWordInputHandlers(overlay, word) {
  let touchTimeout = null;
  let longTapTriggered = false;

  // Add hover sound effect
  overlay.addEventListener('mouseenter', () => {
    if (audioSystem) {
      audioSystem.playHover();
    }
  });

  overlay.addEventListener('mousedown', (e) => {
    e.preventDefault();
    if (e.button === 0) {
      handleWordClickAction('left', overlay, word);
    } else if (e.button === 2) {
      handleWordClickAction('right', overlay, word);
    }
  });

  overlay.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) return;
    longTapTriggered = false;
    touchTimeout = setTimeout(() => {
      longTapTriggered = true;
      handleWordClickAction('left', overlay, word);
    }, 450); // Adjust duration here
  }, { passive: false });

  overlay.addEventListener('touchend', (e) => {
    if (touchTimeout) clearTimeout(touchTimeout);
    if (!longTapTriggered) {
      // If long-press didn't trigger, treat as short tap (right)
      handleWordClickAction('right', overlay, word);
    }
    // else: long press already handled, do nothing
  });

  overlay.addEventListener('touchmove', (e) => {
    if (touchTimeout) clearTimeout(touchTimeout);
  });
}

function handleWordClickAction(type, overlay, word) {
  if (overlay._handled) return;
  overlay._handled = true;

  const isNew = overlay._isNew;
  const isSeen = !isNew;
  let feedbackMsg;
  let isGood;

  if (type === 'left') {
    if (isNew) {
      incrementScore();
      feedbackMsg = 'Correct';
      isGood = true;
      // Play correct sound
      if (audioSystem) {
        audioSystem.playCorrect();
      }
    } else {
      incrementStrike();
      feedbackMsg = 'Was seen';
      isGood = false;
      // Play incorrect sound
      if (audioSystem) {
        audioSystem.playIncorrect();
      }
    }
  } else if (type === 'right') {
    if (isSeen) {
      incrementScore();
      feedbackMsg = 'Correct';
      isGood = true;
      // Play correct sound
      if (audioSystem) {
        audioSystem.playCorrect();
      }
    } else {
      incrementStrike();
      feedbackMsg = 'Was new';
      isGood = false;
      // Play incorrect sound
      if (audioSystem) {
        audioSystem.playIncorrect();
      }
    }
  } else {
    // In case of unexpected input, fallback
    feedbackMsg = '';
    isGood = false;
  }

  showTileFeedback(overlay.parentNode, feedbackMsg, isGood);
  removeOverlayFromTile(overlay);
}

window.oncontextmenu = () => false;
