// renderSystem.js — Draws game objects to the canvas each frame.
// HUD/stats are rendered in the HTML sidebar (see main.js updateSidebar).
// This is a side-effect system: it draws to the canvas and returns the world unchanged.

import { query } from '../ecs/query.js';

// ── Per-tag glow colours and canvas fallback fills ─────────────────────
const ITEM_GLOW_COLOR = {
  blood:   'rgba(229, 57, 53,   0.55)',
  wetWipe: 'rgba(144, 164, 174, 0.45)',
  water:   'rgba(41,  182, 246, 0.55)',
};

const ITEM_FALLBACK_COLOR = {
  blood:   '#e53935',
  wetWipe: '#b0bec5',
  water:   '#29b6f6',
};

// ── Pad shake constants ────────────────────────────────────────────────
/** Maximum horizontal offset (px) at peak shake intensity. */
const SHAKE_AMPLITUDE  = 9;
/** Oscillation frequency multiplier applied to `performance.now()`. */
const SHAKE_FREQUENCY  = 0.055;
/** Total shake duration in seconds (must match progressionSystem). */
const SHAKE_DURATION   = 0.4;

// ── Background particles ───────────────────────────────────────────────
const PARTICLE_COLORS = ['#f8bbd0', '#e1bee7', '#b3e5fc', '#fff9c4', '#c8e6c9', '#fff'];

/** @type {Array<{baseX,baseY,r,speed,sway,phase,color}>|null} */
let particles = null;

/**
 * Lazily initialises the background particle array using the actual canvas dimensions.
 * Called on the first rendered frame so mobile canvas sizes are reflected correctly.
 *
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 */
function initParticles(canvasWidth, canvasHeight) {
  particles = Array.from({ length: 22 }, (_, index) => ({
    baseX: Math.random() * canvasWidth,
    baseY: Math.random() * canvasHeight,
    r:     2.5 + Math.random() * 5,
    speed: 12  + Math.random() * 18,
    sway:  6   + Math.random() * 10,
    phase: Math.random() * Math.PI * 2,
    color: PARTICLE_COLORS[index % PARTICLE_COLORS.length],
  }));
}

/**
 * Draws all background particles with a rising, swaying motion.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 */
function drawParticles(ctx, canvasWidth, canvasHeight) {
  const timeSec = performance.now() * 0.001;
  ctx.save();
  particles.forEach(particle => {
    const risenY    = ((particle.baseY - timeSec * particle.speed) % canvasHeight + canvasHeight) % canvasHeight;
    const swayedX   = particle.baseX + Math.sin(timeSec * 0.45 + particle.phase) * particle.sway;
    const opacity   = 0.1 + 0.12 * Math.sin(timeSec * 0.7 + particle.phase);
    ctx.globalAlpha = opacity;
    ctx.fillStyle   = particle.color;
    ctx.beginPath();
    ctx.arc(swayedX, risenY, particle.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ── Main export ────────────────────────────────────────────────────────

/**
 * Creates a render system bound to the given canvas context and asset map.
 * Returns a system function `(world, dt) => world` usable in the game pipeline.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Record<string, HTMLImageElement>} assets - Keyed by entity tag or 'background'/'pad'.
 * @returns {function(import('../ecs/world.js').World, number): import('../ecs/world.js').World}
 */
export function renderSystem(ctx, assets) {
  return function drawFrame(world, _dt) {
    const { config } = world.resources;
    const { width, height } = config.canvas;
    const timeSec = performance.now() * 0.001;

    // 1. Clear and draw background
    ctx.clearRect(0, 0, width, height);
    if (assets.background) {
      ctx.drawImage(assets.background, 0, 0, width, height);
    } else {
      ctx.fillStyle = '#fde8ee';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Rising bubble particles — init on first frame using real canvas size
    if (!particles) initParticles(width, height);
    drawParticles(ctx, width, height);

    // 3. Falling items — wobble rotation + soft glow halo
    const fallingEntities = query(world, 'Tag', 'Position', 'Size').filter(
      entityId => world.components.Tag.get(entityId) !== 'player'
    );

    fallingEntities.forEach(entityId => {
      const position  = world.components.Position.get(entityId);
      const size      = world.components.Size.get(entityId);
      const tag       = world.components.Tag.get(entityId);
      const image     = assets[tag];

      const centerX     = position.x + size.w / 2;
      const centerY     = position.y + size.h / 2;
      const wobbleAngle = Math.sin(timeSec * 3.2 + entityId * 1.9) * 0.18;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(wobbleAngle);
      ctx.shadowColor = ITEM_GLOW_COLOR[tag]     ?? 'rgba(200,100,150,0.4)';
      ctx.shadowBlur  = 10;

      if (image) {
        ctx.drawImage(image, -size.w / 2, -size.h / 2, size.w, size.h);
      } else {
        ctx.fillStyle = ITEM_FALLBACK_COLOR[tag] ?? '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, size.w / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    // 4. Player pad — breathing pink glow + shake effect on wet wipe catch
    const [playerId] = query(world, 'Tag', 'Position', 'Size').filter(
      entityId => world.components.Tag.get(entityId) === 'player'
    );

    if (playerId != null) {
      const padPosition  = world.components.Position.get(playerId);
      const padSize      = world.components.Size.get(playerId);
      const glowPulse    = 0.5 + 0.5 * Math.sin(timeSec * 2.8);

      const shakeIntensity = world.resources.game.padShake ?? 0;
      const shakeOffsetX   = shakeIntensity > 0
        ? Math.sin(performance.now() * SHAKE_FREQUENCY) * SHAKE_AMPLITUDE * (shakeIntensity / SHAKE_DURATION)
        : 0;

      ctx.save();
      ctx.shadowColor = `rgba(240, 100, 160, ${0.35 + glowPulse * 0.35})`;
      ctx.shadowBlur  = 10 + glowPulse * 10;

      if (assets.pad) {
        ctx.drawImage(assets.pad, padPosition.x + shakeOffsetX, padPosition.y, padSize.w, padSize.h);
      } else {
        ctx.fillStyle = '#fce4ec';
        ctx.beginPath();
        ctx.roundRect(padPosition.x + shakeOffsetX, padPosition.y, padSize.w, padSize.h, 8);
        ctx.fill();
      }
      ctx.restore();
    }

    return world;
  };
}
