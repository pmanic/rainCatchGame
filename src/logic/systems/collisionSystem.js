// collisionSystem.js — AABB collision detection between the player pad and falling items.
// Emits 'collected' events rather than mutating game state directly,
// keeping this system decoupled from scoring and progression logic.

import { query }        from '../ecs/query.js';
import { removeEntity } from '../ecs/world.js';

/**
 * Returns true when two axis-aligned bounding boxes overlap.
 * Each box is described by its top-left corner (x, y) and dimensions (w, h).
 *
 * @param {number} ax - Box A left edge.
 * @param {number} ay - Box A top edge.
 * @param {number} aw - Box A width.
 * @param {number} ah - Box A height.
 * @param {number} bx - Box B left edge.
 * @param {number} by - Box B top edge.
 * @param {number} bw - Box B width.
 * @param {number} bh - Box B height.
 * @returns {boolean}
 */
function aabbOverlaps(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx &&
         ay < by + bh && ay + ah > by;
}

/**
 * Tests every falling entity against the player pad.
 * On collision: removes the entity and appends a `{ type: 'collected', tag }` event.
 *
 * @param {import('../ecs/world.js').World} world
 * @param {number} _dt - Unused; present to satisfy the system signature.
 * @returns {import('../ecs/world.js').World}
 */
export function collisionSystem(world, _dt) {
  const [playerId] = query(world, 'Tag', 'Position', 'Size').filter(
    entityId => world.components.Tag.get(entityId) === 'player'
  );
  if (playerId == null) return world;

  const padPosition = world.components.Position.get(playerId);
  const padSize     = world.components.Size.get(playerId);

  const fallingEntities = query(world, 'Tag', 'Position', 'Size').filter(
    entityId => entityId !== playerId
  );

  return fallingEntities.reduce((accWorld, entityId) => {
    const itemPosition = accWorld.components.Position.get(entityId);
    const itemSize     = accWorld.components.Size.get(entityId);
    const itemTag      = accWorld.components.Tag.get(entityId);

    const hit = aabbOverlaps(
      padPosition.x, padPosition.y, padSize.w, padSize.h,
      itemPosition.x, itemPosition.y, itemSize.w, itemSize.h
    );
    if (!hit) return accWorld;

    return {
      ...removeEntity(accWorld, entityId),
      events: [...accWorld.events, { type: 'collected', tag: itemTag }],
    };
  }, world);
}
