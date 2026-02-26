// main.js — Entry point: canvas setup, input wiring, game loop, and DOM sync.

import { pipe }              from './ecs/helpers.js';
import { initWorld, CONFIG } from './game/initWorld.js';
import { loadAssets }        from './game/assets.js';
import { inputSystem }       from './systems/inputSystem.js';
import { playerSystem }      from './systems/playerSystem.js';
import { spawnSystem }       from './systems/spawnSystem.js';
import { physicsSystem }     from './systems/physicsSystem.js';
import { collisionSystem }   from './systems/collisionSystem.js';
import { cleanupSystem }     from './systems/cleanupSystem.js';
import { progressionSystem } from './systems/progressionSystem.js';
import { renderSystem }      from './systems/renderSystem.js';

// ── Canvas setup ───────────────────────────────────────────────────────
const canvas = document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');

// On mobile (below the desktop breakpoint) size the canvas to 95% of the
// viewport so game logic coordinates match the CSS display size exactly.
// Must happen before initWorld() so CONFIG.canvas reflects real dimensions.
const DESKTOP_BREAKPOINT_PX = 1180;
if (window.innerWidth < DESKTOP_BREAKPOINT_PX) {
  CONFIG.canvas.width  = Math.round(window.innerWidth  * 0.95);
  CONFIG.canvas.height = Math.round(window.innerHeight * 0.95);
}
canvas.width  = CONFIG.canvas.width;
canvas.height = CONFIG.canvas.height;

// ── Raw input state ────────────────────────────────────────────────────
// `pointerX` holds the canvas-relative X coordinate from mouse/touch,
// or null when no pointer is active. Keyboard input clears it so keys take priority.
const rawInput = { left: false, right: false, pointerX: null };

// Keyboard — pressing a movement key disables pointer tracking
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') { rawInput.left  = true;  rawInput.pointerX = null; }
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { rawInput.right = true;  rawInput.pointerX = null; }
});
window.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') rawInput.left  = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') rawInput.right = false;
});

/**
 * Converts a client X coordinate into a canvas-space X coordinate,
 * accounting for any CSS scaling applied to the canvas element.
 *
 * @param {number} clientX
 * @returns {number}
 */
function toCanvasX(clientX) {
  const boundingRect  = canvas.getBoundingClientRect();
  const cssToCanvasRatio = canvas.width / boundingRect.width;
  return (clientX - boundingRect.left) * cssToCanvasRatio;
}

// Mouse — pad follows cursor while over the canvas
canvas.addEventListener('mousemove',  e  => { rawInput.pointerX = toCanvasX(e.clientX); });
canvas.addEventListener('mouseleave', () => { rawInput.pointerX = null; });

// Touch — drag pad with finger
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  rawInput.pointerX = toCanvasX(e.touches[0].clientX);
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  rawInput.pointerX = toCanvasX(e.touches[0].clientX);
}, { passive: false });

canvas.addEventListener('touchend', () => { rawInput.pointerX = null; });

// ── Start screen ───────────────────────────────────────────────────────
const startScreenEl = document.getElementById('start-screen');
const startButtonEl = document.getElementById('start-btn');

// ── Game-over modal ────────────────────────────────────────────────────
const gameOverModalEl   = document.getElementById('gameover-modal');
const modalScoreEl      = document.getElementById('modal-score');
const modalBestLevelEl  = document.getElementById('modal-level');
const restartButtonEl   = document.getElementById('restart-btn');

/**
 * Populates and reveals the game-over modal with final stats.
 * @param {import('./ecs/world.js').GameState} gameState
 */
function showGameOverModal(gameState) {
  modalScoreEl.textContent     = gameState.score;
  modalBestLevelEl.textContent = CONFIG.padLevels[gameState.bestLevel].label;
  gameOverModalEl.classList.remove('hidden');
  restartButtonEl.focus();
}

/** Hides the game-over modal. */
function hideGameOverModal() {
  gameOverModalEl.classList.add('hidden');
}

restartButtonEl.addEventListener('click', restartGame);
restartButtonEl.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') restartGame();
});

// ── Sidebar & mobile HUD DOM references ───────────────────────────────
const scoreDisplayEl    = document.getElementById('score-display');
const padLevelNameEl    = document.getElementById('level-name');
const levelBarEls       = [...document.querySelectorAll('.level-bar')];
const missDotEls        = [...document.querySelectorAll('.miss-drop')];
const pageFillEl        = document.getElementById('page-fill');
const gaugeNumbersEl    = document.getElementById('gauge-numbers');
const mobileScoreEl     = document.getElementById('mobile-score');
const mobileMissDotEls  = [...document.querySelectorAll('.mobile-miss-drop')];

/**
 * Syncs all sidebar and mobile HUD elements to the current world state.
 * Called once per frame while the game is running and once on restart.
 *
 * @param {import('./ecs/world.js').World} world
 */
function syncHud(world) {
  const { game, config } = world.resources;
  const currentLevelData = config.padLevels[game.padLevel];
  const gaugeFillPercent = Math.min(game.gauge / currentLevelData.capacity, 1) * 100;

  scoreDisplayEl.textContent  = game.score;
  mobileScoreEl.textContent   = game.score;
  padLevelNameEl.textContent  = currentLevelData.label;
  gaugeNumbersEl.textContent  = `Fill: ${game.gauge} / ${currentLevelData.capacity}`;

  // Drive the full-page liquid fill overlay
  pageFillEl.style.height = `${gaugeFillPercent}%`;

  // Level progression bars — highlight the active level, dim passed ones
  levelBarEls.forEach(barEl => {
    const barLevelIndex = Number(barEl.dataset.level);
    barEl.classList.toggle('active', barLevelIndex === game.padLevel);
    barEl.classList.toggle('passed', barLevelIndex < game.padLevel);
  });

  // Life indicators — a dot is 'filled' (visible) while it hasn't been spent
  missDotEls.forEach((dotEl, index) => {
    dotEl.classList.toggle('filled', index >= game.missedDrops);
  });
  mobileMissDotEls.forEach((dotEl, index) => {
    dotEl.classList.toggle('filled', index >= game.missedDrops);
  });
}

// ── World state and system pipeline ───────────────────────────────────
let world         = initWorld();
let renderFrame;     // renderSystem bound to ctx + assets
let runGameFrame;    // full system pipeline for one game tick
let lastTimestamp = null;

/**
 * Builds the ordered system pipeline for a single game tick.
 * Each system is a pure function `(world, dt) => world`.
 *
 * @param {function} renderFn - The render system, pre-bound to ctx and assets.
 * @returns {function(import('./ecs/world.js').World, number): import('./ecs/world.js').World}
 */
function buildGamePipeline(renderFn) {
  return (currentWorld, dt) => pipe(
    w => inputSystem(rawInput)(w, dt),
    w => playerSystem(w, dt),
    w => spawnSystem(w, dt),
    w => physicsSystem(w, dt),
    w => collisionSystem(w, dt),
    w => cleanupSystem(w, dt),
    w => progressionSystem(w, dt),
    w => renderFn(w, dt),
  )(currentWorld);
}

// ── Game loop ──────────────────────────────────────────────────────────

/**
 * Main `requestAnimationFrame` loop. Advances the simulation each tick,
 * then syncs the HUD and checks for the game-over condition.
 *
 * @param {DOMHighResTimeStamp} timestamp
 */
function gameLoop(timestamp) {
  if (lastTimestamp === null) lastTimestamp = timestamp;
  const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1); // cap at 100 ms
  lastTimestamp = timestamp;

  if (world.resources.game.status === 'running') {
    world = runGameFrame(world, dt);
    syncHud(world);

    if (world.resources.game.status === 'gameover') {
      renderFrame(world, 0);
      showGameOverModal(world.resources.game);
    }
  } else {
    renderFrame(world, 0);
  }

  requestAnimationFrame(gameLoop);
}

/**
 * Resets the world to a fresh state and hides the game-over modal.
 * Triggered by the "Play Again" button.
 */
function restartGame() {
  hideGameOverModal();
  world         = initWorld();
  lastTimestamp = null;
  syncHud(world);
}

// ── Start screen ───────────────────────────────────────────────────────

/**
 * Hides the start screen and begins the game loop.
 * Called when the player clicks or presses Start.
 */
function startGame() {
  startScreenEl.classList.add('hidden');
  lastTimestamp = null;
  requestAnimationFrame(gameLoop);
}

startButtonEl.addEventListener('click', startGame);
startButtonEl.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') startGame();
});

// ── Boot sequence ──────────────────────────────────────────────────────

/**
 * Loads all assets, wires up the pipeline, and primes the HUD.
 * The game loop is NOT started here — it waits for the Start button.
 */
async function boot() {
  // Fill the canvas with a placeholder colour while assets load
  ctx.fillStyle = '#fde8ee';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const assets  = await loadAssets();
  renderFrame   = renderSystem(ctx, assets);
  runGameFrame  = buildGamePipeline(renderFrame);

  syncHud(world); // prime sidebar with initial values
}

boot();
