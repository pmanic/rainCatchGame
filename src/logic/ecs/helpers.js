/**
 * Restricts a number so it stays between the minimum and maximum values.
 *
 * @param {number} min
 * @param {number} max
 * @param {number} value
 * @returns {number}
 */
export function clamp(min, max, value) {
    return Math.min(max, Math.max(min, value));
}

/**
 * Creates a new world object with updated game resource values.
 * The original world is not modified.
 *
 * @param {import('./world.js').World} world
 * @param {Partial<import('./world.js').GameState>} changes
 * @returns {import('./world.js').World}
 */
export function updateGame(world, changes) {
    return {
        ...world,
        resources: {
            ...world.resources,
            game: {
                ...world.resources.game,
                ...changes,
            },
        },
    };
}

/**
 * Runs all systems in order for a single frame.
 * Each system receives the world returned by the previous system.
 *
 * @param {import('./world.js').World} world
 * @param {number} dt
 * @param {Array<function(import('./world.js').World, number): import('./world.js').World>} systems
 * @returns {import('./world.js').World}
 */
export function runSystems(world, dt, systems) {
    return systems.reduce((currentWorld, system) => system(currentWorld, dt), world);
}
