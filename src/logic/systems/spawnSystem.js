import { addEntity, addComponent } from '../ecs/world.js';
import { updateGame } from '../ecs/helpers.js';

/**
 * Picks which item type should spawn based on configured probabilities.
 *
 * @param {function(): number} rng
 * @param {{ rain: number, mud: number, golden: number }} spawnProbs
 * @returns {import('../ecs/world.js').EntityTag}
 */
function pickItemTag(rng, spawnProbs) {
    const roll = rng();

    if (roll < spawnProbs.rain) {
        return 'rain';
    }

    if (roll < spawnProbs.rain + spawnProbs.mud) {
        return 'mud';
    }

    return 'golden';
}

/**
 * Spawns new falling items over time and makes the game faster on smaller buckets.
 *
 * @param {import('../ecs/world.js').World} world
 * @param {number} dt
 * @returns {import('../ecs/world.js').World}
 */
export function spawnSystem(world, dt) {
    const { game, config } = world.resources;
    if (game.status !== 'running') {
        return world;
    }

    const difficultyFraction = game.bucketLevel / (config.bucketLevels.length - 1);
    const spawnInterval = config.baseSpawnInterval -
        difficultyFraction * (config.baseSpawnInterval - config.minSpawnInterval);

    const updatedTimer = game.spawnTimer + dt;
    if (updatedTimer < spawnInterval) {
        return updateGame(world, { spawnTimer: updatedTimer });
    }

    const worldWithTimer = updateGame(world, {
        spawnTimer: updatedTimer - spawnInterval,
    });

    const spawnMargin = config.dropRadius * 2;
    const spawnX = spawnMargin + Math.random() * (config.canvas.width - spawnMargin * 2);
    const itemTag = pickItemTag(Math.random, config.spawnProbs);

    const fallSpeedRange = config.maxFallSpeed - config.baseFallSpeed;
    const itemFallSpeed = config.baseFallSpeed
        + difficultyFraction * fallSpeedRange * 0.6
        + Math.random() * fallSpeedRange * 0.4;

    const [worldWithEntity, itemId] = addEntity(worldWithTimer);
    let nextWorld = addComponent(worldWithEntity, 'Tag', itemId, itemTag);
    nextWorld = addComponent(nextWorld, 'Position', itemId, { x: spawnX, y: -config.dropRadius });
    nextWorld = addComponent(nextWorld, 'Velocity', itemId, { vx: 0, vy: itemFallSpeed });
    nextWorld = addComponent(nextWorld, 'Size', itemId, config.tagSizes[itemTag]);

    return nextWorld;
}
