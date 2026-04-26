import { runSystems, updateGame } from './ecs/helpers.js';
import { initWorld, CONFIG } from './game/initWorld.js';
import { loadAssets } from './game/assets.js';
import { inputSystem } from './systems/inputSystem.js';
import { playerSystem } from './systems/playerSystem.js';
import { spawnSystem } from './systems/spawnSystem.js';
import { physicsSystem } from './systems/physicsSystem.js';
import { collisionSystem } from './systems/collisionSystem.js';
import { cleanupSystem } from './systems/cleanupSystem.js';
import { progressionSystem } from './systems/progressionSystem.js';
import { renderSystem } from './systems/renderSystem.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const startScreenEl = document.getElementById('start-screen');
const startButtonEl = document.getElementById('start-btn');
const playerNameInputEl = document.getElementById('player-name');
const restartButtonEl = document.getElementById('restart-btn');

const gameOverModalEl = document.getElementById('gameover-modal');
const modalScoreEl = document.getElementById('modal-score');
const modalBestLevelEl = document.getElementById('modal-level');

const scoreDisplayEl = document.getElementById('score-display');
const mobileScoreEl = document.getElementById('mobile-score');
const levelNameEl = document.getElementById('level-name');
const gaugeNumbersEl = document.getElementById('gauge-numbers');
const pageFillEl = document.getElementById('page-fill');
const levelBarEls = [...document.querySelectorAll('.level-bar')];
const missDotEls = [...document.querySelectorAll('.miss-drop')];
const mobileMissDotEls = [...document.querySelectorAll('.mobile-miss-drop')];
const playerNameEls = [...document.querySelectorAll('[data-player-name]')];

const DESKTOP_BREAKPOINT_PX = 1180;
if (window.innerWidth < DESKTOP_BREAKPOINT_PX) {
    CONFIG.canvas.width = Math.round(window.innerWidth * 0.98);
    CONFIG.canvas.height = Math.round(window.innerHeight * 0.98);
}

canvas.width = CONFIG.canvas.width;
canvas.height = CONFIG.canvas.height;

const rawInput = {
    left: false,
    right: false,
    pointerX: null,
    playerName: playerNameInputEl.value.trim() || 'Player',
};

let world = initWorld();
let systems = [];
let drawFrame = null;
let lastTimestamp = null;
let animationStarted = false;

/**
 * Updates raw keyboard input when left or right movement keys change state.
 *
 * @param {string} key
 * @param {boolean} isPressed
 * @returns {void}
 */
function setKeyboardState(key, isPressed) {
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        rawInput.left = isPressed;
        if (isPressed) {
            rawInput.pointerX = null;
        }
    }

    if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        rawInput.right = isPressed;
        if (isPressed) {
            rawInput.pointerX = null;
        }
    }
}

window.addEventListener('keydown', event => setKeyboardState(event.key, true));
window.addEventListener('keyup', event => setKeyboardState(event.key, false));

playerNameInputEl.addEventListener('input', event => {
    const value = event.target.value.trim();
    rawInput.playerName = value === '' ? 'Player' : value.slice(0, 18);
    updatePlayerName(rawInput.playerName);
});

/**
 * Converts a mouse or touch X coordinate from browser space into canvas space.
 *
 * @param {number} clientX
 * @returns {number}
 */
function toCanvasX(clientX) {
    const rect = canvas.getBoundingClientRect();
    return (clientX - rect.left) * (canvas.width / rect.width);
}

canvas.addEventListener('mousemove', event => {
    rawInput.pointerX = toCanvasX(event.clientX);
});

canvas.addEventListener('mouseleave', () => {
    rawInput.pointerX = null;
});

canvas.addEventListener('touchstart', event => {
    event.preventDefault();
    rawInput.pointerX = toCanvasX(event.touches[0].clientX);
}, { passive: false });

canvas.addEventListener('touchmove', event => {
    event.preventDefault();
    rawInput.pointerX = toCanvasX(event.touches[0].clientX);
}, { passive: false });

canvas.addEventListener('touchend', () => {
    rawInput.pointerX = null;
});

/**
 * Updates all UI placeholders that show the player name.
 *
 * @param {string} playerName
 * @returns {void}
 */
function updatePlayerName(playerName) {
    playerNameEls.forEach(element => {
        element.textContent = playerName;
    });
}

/**
 * Opens the styled game-over modal with the final score and best bucket level.
 *
 * @param {import('./ecs/world.js').GameState} gameState
 * @returns {void}
 */
function showGameOverModal(gameState) {
    modalScoreEl.textContent = String(gameState.score);
    modalBestLevelEl.textContent = CONFIG.bucketLevels[gameState.bestLevel].label;
    gameOverModalEl.classList.remove('hidden');
}

/**
 * Hides the game-over modal.
 *
 * @returns {void}
 */
function hideGameOverModal() {
    gameOverModalEl.classList.add('hidden');
}

/**
 * Updates the existing styled HUD using the current ECS state.
 *
 * @param {import('./ecs/world.js').World} worldToShow
 * @returns {void}
 */
function syncHud(worldToShow) {
    const { game, config, input } = worldToShow.resources;
    const currentLevel = config.bucketLevels[game.bucketLevel];
    const fillPercent = Math.min(game.gauge / currentLevel.capacity, 1) * 100;

    updatePlayerName(input.playerName);
    scoreDisplayEl.textContent = String(game.score);
    mobileScoreEl.textContent = String(game.score);
    levelNameEl.textContent = currentLevel.label;
    gaugeNumbersEl.textContent = `Water level: ${game.gauge} / ${currentLevel.capacity}`;
    pageFillEl.style.height = `${fillPercent}%`;

    levelBarEls.forEach(barEl => {
        const levelIndex = Number(barEl.dataset.level);
        barEl.classList.toggle('active', levelIndex === game.bucketLevel);
        barEl.classList.toggle('passed', levelIndex < game.bucketLevel);
    });

    missDotEls.forEach((dotEl, index) => {
        dotEl.classList.toggle('filled', index >= game.missedDrops);
    });

    mobileMissDotEls.forEach((dotEl, index) => {
        dotEl.classList.toggle('filled', index >= game.missedDrops);
    });
}

/**
 * Runs every ECS system for one animation frame.
 *
 * @param {import('./ecs/world.js').World} currentWorld
 * @param {number} dt
 * @returns {import('./ecs/world.js').World}
 */
function runGameFrame(currentWorld, dt) {
    return runSystems(currentWorld, dt, systems);
}

/**
 * Main animation loop. The world only advances while the game is running.
 *
 * @param {number} timestamp
 * @returns {void}
 */
function gameLoop(timestamp) {
    if (lastTimestamp === null) {
        lastTimestamp = timestamp;
    }

    const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
    lastTimestamp = timestamp;

    if (world.resources.game.status === 'running') {
        world = runGameFrame(world, dt);
        syncHud(world);

        if (world.resources.game.status === 'gameover') {
            drawFrame(world, 0);
            showGameOverModal(world.resources.game);
        }
    } else {
        drawFrame(world, 0);
    }

    requestAnimationFrame(gameLoop);
}

/**
 * Creates a fresh running game while keeping the current player name.
 *
 * @returns {void}
 */
function resetToRunningGame() {
    hideGameOverModal();
    world = initWorld();
    world = inputSystem(rawInput)(world, 0);
    world = updateGame(world, { status: 'running' });
    lastTimestamp = null;
    syncHud(world);
}

/**
 * Starts the game from the start screen.
 *
 * @returns {void}
 */
function startGame() {
    startScreenEl.classList.add('hidden');
    resetToRunningGame();

    if (!animationStarted) {
        animationStarted = true;
        requestAnimationFrame(gameLoop);
    }
}

/**
 * Restarts the game after game over.
 *
 * @returns {void}
 */
function restartGame() {
    resetToRunningGame();
}

startButtonEl.addEventListener('click', startGame);
restartButtonEl.addEventListener('click', restartGame);

/**
 * Loads assets, creates the render system, builds the ECS pipeline,
 * and draws the initial ready state.
 *
 * @returns {Promise<void>}
 */
async function boot() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const assets = await loadAssets();
    drawFrame = renderSystem(ctx, assets);

    systems = [
        inputSystem(rawInput),
        playerSystem,
        spawnSystem,
        physicsSystem,
        collisionSystem,
        cleanupSystem,
        progressionSystem,
        drawFrame,
    ];

    world = inputSystem(rawInput)(world, 0);
    syncHud(world);
    drawFrame(world, 0);
}

boot();
