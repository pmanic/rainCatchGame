import { updateComponent } from '../ecs/world.js';
import { clamp } from '../ecs/helpers.js';

/**
 * Finds the player entity id by scanning the tag component map.
 *
 * @param {import('../ecs/world.js').World} world
 * @returns {number|null}
 */
function findPlayerId(world) {
    for (const [entityId, tag] of world.components.Tag.entries()) {
        if (
            tag === 'player' &&
            world.components.Position.has(entityId) &&
            world.components.Size.has(entityId)
        ) {
            return entityId;
        }
    }

    return null;
}

/**
 * Moves the bucket according to pointer or keyboard input.
 *
 * @param {import('../ecs/world.js').World} world
 * @param {number} dt
 * @returns {import('../ecs/world.js').World}
 */
export function playerSystem(world, dt) {
    const { input, config } = world.resources;
    const { bucketSpeed, canvas } = config;
    const playerId = findPlayerId(world);

    if (playerId == null) {
        return world;
    }

    const position = world.components.Position.get(playerId);
    const size = world.components.Size.get(playerId);
    let nextX = position.x;

    if (input.pointerX != null) {
        nextX = clamp(0, canvas.width - size.w, input.pointerX - size.w / 2);
    } else {
        const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
        nextX = clamp(0, canvas.width - size.w, position.x + direction * bucketSpeed * dt);
    }

    return updateComponent(world, 'Position', playerId, { x: nextX });
}
