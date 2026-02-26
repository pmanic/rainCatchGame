// spawnSystem.js — Spawns falling items at timed intervals with increasing difficulty.

import { addEntity, addComponent } from '../ecs/world.js';
import { updateGame }              from '../ecs/helpers.js';

/**
 * Randomly picks an item tag based on configured probabilities.
 * Uses a single random roll compared against cumulative probability thresholds.
 *
 * @param {function(): number} rng  - Random number generator returning [0, 1).
 * @param {{ blood: number, wetWipe: number, water: number }} spawnProbs
 * @returns {import('../ecs/world.js').EntityTag}
 */
function pickItemTag(rng, spawnProbs) {
  const roll = rng();
  if (roll < spawnProbs.blood)                        return 'blood';
  if (roll < spawnProbs.blood + spawnProbs.wetWipe)   return 'wetWipe';
  return 'water';
}

/**
 * Accumulates time and spawns a new falling item when the spawn interval elapses.
 * Spawn rate and fall speed scale with the current pad level for increasing difficulty.
 *
 * @param {import('../ecs/world.js').World} world
 * @param {number} dt - Delta time in seconds.
 * @returns {import('../ecs/world.js').World}
 */
export function spawnSystem(world, dt) {
  const { game, config } = world.resources;
  if (game.status !== 'running') return world;

  // Difficulty fraction: 0 at Maxi, 1 at Mini
  const difficultyFraction = game.padLevel / (config.padLevels.length - 1);

  const spawnInterval = config.baseSpawnInterval -
    difficultyFraction * (config.baseSpawnInterval - config.minSpawnInterval);

  const updatedTimer = game.spawnTimer + dt;
  if (updatedTimer < spawnInterval) {
    return updateGame(world, { spawnTimer: updatedTimer });
  }

  // Interval elapsed — reset timer and spawn one item
  let worldReady = updateGame(world, { spawnTimer: updatedTimer - spawnInterval });

  // Random X position keeping the full item sprite inside canvas bounds
  const spawnMargin = config.dropRadius * 2;
  const spawnX      = spawnMargin + Math.random() * (config.canvas.width - spawnMargin * 2);
  const itemTag     = pickItemTag(Math.random, config.spawnProbs);

  // Fall speed: base + level-scaled portion + random variance
  const fallSpeedRange    = config.maxFallSpeed - config.baseFallSpeed;
  const itemFallSpeed     = config.baseFallSpeed
    + difficultyFraction * fallSpeedRange * 0.6
    + Math.random()      * fallSpeedRange * 0.4;

  const [worldWithEntity, itemId] = addEntity(worldReady);
  let worldWithItem = addComponent(worldWithEntity, 'Tag',      itemId, itemTag);
  worldWithItem     = addComponent(worldWithItem,   'Position', itemId, { x: spawnX, y: -config.dropRadius });
  worldWithItem     = addComponent(worldWithItem,   'Velocity', itemId, { vx: 0, vy: itemFallSpeed });
  worldWithItem     = addComponent(worldWithItem,   'Size',     itemId, config.tagSizes[itemTag]);

  return worldWithItem;
}
