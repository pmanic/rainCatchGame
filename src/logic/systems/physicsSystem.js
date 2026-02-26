// physicsSystem.js — Integrates velocity into position for all moving entities.

import { query }           from '../ecs/query.js';
import { updateComponent } from '../ecs/world.js';

/**
 * Advances every entity that has both a Position and a Velocity component
 * by one time step, using simple Euler integration.
 *
 * @param {import('../ecs/world.js').World} world
 * @param {number} dt - Delta time in seconds.
 * @returns {import('../ecs/world.js').World}
 */
export function physicsSystem(world, dt) {
  const movingEntities = query(world, 'Position', 'Velocity');

  return movingEntities.reduce((accWorld, entityId) => {
    const { x, y }   = accWorld.components.Position.get(entityId);
    const { vx, vy } = accWorld.components.Velocity.get(entityId);
    return updateComponent(accWorld, 'Position', entityId, {
      x: x + vx * dt,
      y: y + vy * dt,
    });
  }, world);
}
