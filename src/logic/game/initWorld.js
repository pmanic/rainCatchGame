// initWorld.js — Bootstrap a fresh world with config and player entity.

import { createWorld, addEntity, addComponent } from '../ecs/world.js';

/**
 * Global game configuration.
 * Canvas dimensions may be mutated before `initWorld()` is called
 * (e.g. on mobile to match the viewport).
 *
 * @type {object}
 * @property {{ width: number, height: number }} canvas
 * @property {Array<{ label: string, width: number, capacity: number }>} padLevels
 * @property {number} padHeight          - Pad height in pixels.
 * @property {number} padSpeed           - Pad movement speed in px/s.
 * @property {number} baseFallSpeed      - Slowest fall speed in px/s.
 * @property {number} maxFallSpeed       - Fastest fall speed in px/s.
 * @property {number} baseSpawnInterval  - Initial seconds between item spawns.
 * @property {number} minSpawnInterval   - Minimum seconds between item spawns at max difficulty.
 * @property {number} dropRadius         - Reference half-size for spawn margin and entry Y.
 * @property {{ blood: {w,h}, water: {w,h}, wetWipe: {w,h} }} tagSizes - Render dimensions per tag.
 * @property {{ blood: number, wetWipe: number, water: number }} spawnProbs - Spawn probability per tag (must sum to 1).
 * @property {number} maxMisses          - Number of missed blood drops that triggers game over.
 */
export const CONFIG = {
  canvas: { width: 900, height: 500 },
  padLevels: [
    { label: 'Maxi',   width: 140, capacity: 12 },
    { label: 'Normal', width: 110, capacity: 14 },
    { label: 'Slim',   width: 80,  capacity: 16 },
    { label: 'Mini',   width: 55,  capacity: 18 },
  ],
  padHeight:         20,
  padSpeed:          320,   // px/s
  baseFallSpeed:     140,   // px/s
  maxFallSpeed:      340,   // px/s
  baseSpawnInterval: 1.4,   // seconds between spawns at level 0
  minSpawnInterval:  0.55,  // seconds between spawns at max level
  dropRadius:        18,    // reference half-size used for spawn margin / entry Y
  // Per-tag render sizes preserving each SVG's natural aspect ratio
  // (scaled so the longer dimension equals dropRadius * 2 = 36)
  tagSizes: {
    blood:   { w: 32, h: 36 },   // viewBox 28×32 → scale ×1.125
    water:   { w: 32, h: 36 },   // viewBox 28×32 → scale ×1.125
    wetWipe: { w: 36, h: 32 },   // viewBox 40×36 → scale ×0.9
  },
  spawnProbs: { blood: 0.75, wetWipe: 0.20, water: 0.05 },
  maxMisses:  3,
};

/**
 * Creates a fresh world populated with the global config and the player pad entity.
 * Call after any mutations to `CONFIG.canvas` so entity positions reflect real dimensions.
 * @returns {import('../ecs/world.js').World}
 */
export function initWorld() {
  let world = createWorld();
  world = { ...world, resources: { ...world.resources, config: CONFIG } };

  const [worldWithEntity, playerId] = addEntity(world);

  const padWidth = CONFIG.padLevels[0].width;
  const startX   = CONFIG.canvas.width  / 2 - padWidth / 2;
  const startY   = CONFIG.canvas.height - 30;

  let worldWithComponents = addComponent(worldWithEntity, 'Tag',      playerId, 'player');
  worldWithComponents     = addComponent(worldWithComponents, 'Position', playerId, { x: startX, y: startY });
  worldWithComponents     = addComponent(worldWithComponents, 'Size',     playerId, { w: padWidth, h: CONFIG.padHeight });

  return worldWithComponents;
}
