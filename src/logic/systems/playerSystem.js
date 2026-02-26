// playerSystem.js — Moves the player pad based on the current frame's input.
// Priority: mouse/touch pointer > keyboard arrows/WASD.

import { query }           from '../ecs/query.js';
import { updateComponent } from '../ecs/world.js';
import { clamp }           from '../ecs/helpers.js';

/**
 * Moves the player pad entity each frame.
 * When a pointer position is active (mouse/touch), the pad centres on it.
 * Otherwise keyboard left/right input drives movement at `padSpeed` px/s.
 *
 * @param {import('../ecs/world.js').World} world
 * @param {number} dt - Delta time in seconds.
 * @returns {import('../ecs/world.js').World}
 */
export function playerSystem(world, dt) {
  const { input, config } = world.resources;
  const { padSpeed, canvas } = config;

  const [playerId] = query(world, 'Tag', 'Position', 'Size').filter(
    entityId => world.components.Tag.get(entityId) === 'player'
  );
  if (playerId == null) return world;

  const padPosition = world.components.Position.get(playerId);
  const padSize     = world.components.Size.get(playerId);

  let targetX;

  if (input.pointerX != null) {
    // Mouse or touch: centre the pad on the pointer, clamped to canvas bounds.
    targetX = clamp(0, canvas.width - padSize.w)(input.pointerX - padSize.w / 2);
  } else {
    // Keyboard: derive direction from held keys and integrate over dt.
    const moveDirection = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    targetX = clamp(0, canvas.width - padSize.w)(padPosition.x + moveDirection * padSpeed * dt);
  }

  return updateComponent(world, 'Position', playerId, { x: targetX });
}
