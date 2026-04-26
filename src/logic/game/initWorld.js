import { createWorld, addEntity, addComponent } from '../ecs/world.js';

export const CONFIG = {
    canvas: { width: 1120, height: 640 },
    bucketLevels: [
        { label: 'Barrel', width: 148, capacity: 12 },
        { label: 'Bucket', width: 118, capacity: 14 },
        { label: 'Pail', width: 88, capacity: 16 },
        { label: 'Tin', width: 60, capacity: 18 },
    ],
    bucketHeight: 28,
    bucketSpeed: 320,
    baseFallSpeed: 140,
    maxFallSpeed: 340,
    baseSpawnInterval: 1.4,
    minSpawnInterval: 0.55,
    dropRadius: 18,
    tagSizes: {
        rain: { w: 32, h: 36 },
        golden: { w: 32, h: 36 },
        mud: { w: 36, h: 32 },
    },
    spawnProbs: { rain: 0.75, mud: 0.20, golden: 0.05 },
    maxMisses: 3,
};

/**
 * Creates a fresh game world with the player bucket placed at the bottom
 * center of the canvas and the global config attached to resources.
 *
 * @returns {import('../ecs/world.js').World}
 */
export function initWorld() {
    let world = createWorld();
    world = {
        ...world,
        resources: {
            ...world.resources,
            config: CONFIG,
        },
    };

    const [worldWithEntity, playerId] = addEntity(world);
    const bucketWidth = CONFIG.bucketLevels[0].width;
    const startX = CONFIG.canvas.width / 2 - bucketWidth / 2;
    const startY = CONFIG.canvas.height - 42;

    let nextWorld = addComponent(worldWithEntity, 'Tag', playerId, 'player');
    nextWorld = addComponent(nextWorld, 'Position', playerId, { x: startX, y: startY });
    nextWorld = addComponent(nextWorld, 'Size', playerId, { w: bucketWidth, h: CONFIG.bucketHeight });

    return nextWorld;
}
