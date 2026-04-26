import { updateComponent } from '../ecs/world.js';

/**
 * Moves every entity that has both Position and Velocity components.
 *
 * @param {import('../ecs/world.js').World} world
 * @param {number} dt
 * @returns {import('../ecs/world.js').World}
 */
export function physicsSystem(world, dt) {
    const movingEntities = [...world.components.Position.keys()]
        .filter(entityId => world.components.Velocity.has(entityId));

    return movingEntities.reduce((currentWorld, entityId) => {
        const { x, y } = currentWorld.components.Position.get(entityId);
        const { vx, vy } = currentWorld.components.Velocity.get(entityId);

        return updateComponent(currentWorld, 'Position', entityId, {
            x: x + vx * dt,
            y: y + vy * dt,
        });
    }, world);
}
