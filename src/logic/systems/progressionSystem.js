import { clamp, updateGame } from '../ecs/helpers.js';
import { updateComponent } from '../ecs/world.js';

/**
 * Finds the player entity id.
 *
 * @param {import('../ecs/world.js').World} world
 * @returns {number|null}
 */
function findPlayerId(world) {
    for (const [entityId, tag] of world.components.Tag.entries()) {
        if (tag === 'player') {
            return entityId;
        }
    }

    return null;
}

/**
 * Applies the gameplay effect of one collected item.
 *
 * @param {import('../ecs/world.js').World} world
 * @param {import('../ecs/world.js').EntityTag} tag
 * @param {object} config
 * @returns {import('../ecs/world.js').World}
 */
function applyCollectedItem(world, tag, config) {
    const game = world.resources.game;

    if (tag === 'rain') {
        return updateGame(world, {
            score: game.score + 1,
            gauge: game.gauge + 1,
        });
    }

    if (tag === 'mud') {
        const nextScore = Math.max(0, game.score - 1);
        const nextGauge = Math.max(0, game.gauge - 2);

        return updateGame(world, {
            score: nextScore,
            gauge: nextGauge,
            status: game.score > 0 && nextScore === 0 ? 'gameover' : game.status,
        });
    }

    if (tag === 'golden') {
        return updateGame(world, {
            missedDrops: clamp(0, config.maxMisses, game.missedDrops - 1),
        });
    }

    return world;
}

/**
 * Processes all queued events for the current frame and clears the event list.
 *
 * @param {import('../ecs/world.js').World} world
 * @param {object} config
 * @returns {import('../ecs/world.js').World}
 */
function applyEvents(world, config) {
    const worldAfterEvents = world.events.reduce((currentWorld, event) => {
        if (event.type !== 'collected') {
            return currentWorld;
        }

        return applyCollectedItem(currentWorld, event.tag, config);
    }, world);

    return {
        ...worldAfterEvents,
        events: [],
    };
}

/**
 * Changes the player bucket width when the level advances.
 *
 * @param {import('../ecs/world.js').World} world
 * @param {number} nextLevelIndex
 * @param {object} config
 * @returns {import('../ecs/world.js').World}
 */
function updateBucketSize(world, nextLevelIndex, config) {
    const playerId = findPlayerId(world);

    if (playerId == null) {
        return world;
    }

    return updateComponent(world, 'Size', playerId, {
        w: config.bucketLevels[nextLevelIndex].width,
    });
}

/**
 * Updates score, misses, bucket size, and game-over state.
 *
 * @param {import('../ecs/world.js').World} world
 * @param {number} _dt
 * @returns {import('../ecs/world.js').World}
 */
export function progressionSystem(world, _dt) {
    const { config } = world.resources;
    world = applyEvents(world, config);

    const currentGame = world.resources.game;
    if (currentGame.missedDrops >= config.maxMisses) {
        return updateGame(world, { status: 'gameover' });
    }

    const currentLevel = config.bucketLevels[currentGame.bucketLevel];
    if (currentGame.gauge < currentLevel.capacity) {
        return world;
    }

    const nextLevelIndex = Math.min(currentGame.bucketLevel + 1, config.bucketLevels.length - 1);
    const levelChanged = nextLevelIndex !== currentGame.bucketLevel;
    const nextBestLevel = Math.max(currentGame.bestLevel, nextLevelIndex);

    if (levelChanged) {
        world = updateBucketSize(world, nextLevelIndex, config);
    }

    return updateGame(world, {
        bucketLevel: nextLevelIndex,
        bestLevel: nextBestLevel,
        gauge: levelChanged ? 0 : currentGame.gauge,
    });
}
