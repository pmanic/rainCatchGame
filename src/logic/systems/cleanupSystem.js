import { removeEntity } from '../ecs/world.js';
import { updateGame } from '../ecs/helpers.js';

/**
 * Collects all falling entities that have position data.
 *
 * @param {import('../ecs/world.js').World} world
 * @returns {number[]}
 */
function getFallingEntityIds(world) {
    return [...world.components.Tag.entries()]
        .filter(([entityId, tag]) => tag !== 'player' && world.components.Position.has(entityId))
        .map(([entityId]) => entityId);
}

/**
 * Removes items that leave the bottom of the screen and counts missed rain drops.
 *
 * @param {import('../ecs/world.js').World} world
 * @param {number} _dt
 * @returns {import('../ecs/world.js').World}
 */
export function cleanupSystem(world, _dt) {
    const { config } = world.resources;
    const bottomLimit = config.canvas.height + config.dropRadius * 2;
    const fallingEntities = getFallingEntityIds(world);

    return fallingEntities.reduce((currentWorld, entityId) => {
        const position = currentWorld.components.Position.get(entityId);
        if (position.y < bottomLimit) {
            return currentWorld;
        }

        const itemTag = currentWorld.components.Tag.get(entityId);
        let nextWorld = removeEntity(currentWorld, entityId);

        if (itemTag === 'rain') {
            nextWorld = updateGame(nextWorld, {
                missedDrops: nextWorld.resources.game.missedDrops + 1,
            });
        }

        return nextWorld;
    }, world);
}
