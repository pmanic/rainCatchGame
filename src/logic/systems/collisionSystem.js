import { removeEntity } from '../ecs/world.js';

/**
 * Checks if two axis-aligned rectangles overlap.
 *
 * @param {number} ax
 * @param {number} ay
 * @param {number} aw
 * @param {number} ah
 * @param {number} bx
 * @param {number} by
 * @param {number} bw
 * @param {number} bh
 * @returns {boolean}
 */
function aabbOverlaps(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx &&
        ay < by + bh && ay + ah > by;
}

/**
 * Finds the player entity id.
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
 * Collects all currently active falling item ids.
 *
 * @param {import('../ecs/world.js').World} world
 * @param {number} playerId
 * @returns {number[]}
 */
function getFallingEntityIds(world, playerId) {
    return [...world.components.Tag.entries()]
        .filter(([entityId, tag]) => {
            return entityId !== playerId &&
                tag !== 'player' &&
                world.components.Position.has(entityId) &&
                world.components.Size.has(entityId);
        })
        .map(([entityId]) => entityId);
}

/**
 * Detects bucket collisions with falling items and emits collected events.
 *
 * @param {import('../ecs/world.js').World} world
 * @param {number} _dt
 * @returns {import('../ecs/world.js').World}
 */
export function collisionSystem(world, _dt) {
    const playerId = findPlayerId(world);

    if (playerId == null) {
        return world;
    }

    const bucketPosition = world.components.Position.get(playerId);
    const bucketSize = world.components.Size.get(playerId);
    const fallingEntities = getFallingEntityIds(world, playerId);

    return fallingEntities.reduce((currentWorld, entityId) => {
        const itemPosition = currentWorld.components.Position.get(entityId);
        const itemSize = currentWorld.components.Size.get(entityId);
        const itemTag = currentWorld.components.Tag.get(entityId);

        const hit = aabbOverlaps(
            bucketPosition.x, bucketPosition.y, bucketSize.w, bucketSize.h,
            itemPosition.x, itemPosition.y, itemSize.w, itemSize.h
        );

        if (!hit) {
            return currentWorld;
        }

        return {
            ...removeEntity(currentWorld, entityId),
            events: [...currentWorld.events, { type: 'collected', tag: itemTag }],
        };
    }, world);
}
