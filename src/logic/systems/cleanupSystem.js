// cleanupSystem.js — Removes entities that have fallen off screen.
// Penalises missed blood drops by incrementing the missed-drop counter.

import { query }        from '../ecs/query.js';
import { removeEntity } from '../ecs/world.js';
import { updateGame }   from '../ecs/helpers.js';

/**
 * Scans all non-player entities. Any entity whose Y position has passed
 * the canvas bottom is removed. Missed blood drops increment `missedDrops`.
 *
 * @param {import('../ecs/world.js').World} world
 * @param {number} _dt - Unused; present to satisfy the system signature.
 * @returns {import('../ecs/world.js').World}
 */
export function cleanupSystem(world, _dt) {
  const { config } = world.resources;
  const offScreenThreshold = config.canvas.height + config.dropRadius * 2;

  const fallingEntities = query(world, 'Tag', 'Position').filter(
    entityId => world.components.Tag.get(entityId) !== 'player'
  );

  return fallingEntities.reduce((accWorld, entityId) => {
    const position = accWorld.components.Position.get(entityId);
    if (position.y < offScreenThreshold) return accWorld; // still on screen

    const itemTag    = accWorld.components.Tag.get(entityId);
    const isBloodDrop = itemTag === 'blood';

    let worldAfterRemoval = removeEntity(accWorld, entityId);
    if (isBloodDrop) {
      worldAfterRemoval = updateGame(worldAfterRemoval, {
        missedDrops: worldAfterRemoval.resources.game.missedDrops + 1,
        events: [...(worldAfterRemoval.events ?? []), { type: 'missed' }],
      });
    }
    return worldAfterRemoval;
  }, world);
}
