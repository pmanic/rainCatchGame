/**
 * @typedef {{ x: number, y: number }} Position
 * @typedef {{ vx: number, vy: number }} Velocity
 * @typedef {{ w: number, h: number }} Size
 * @typedef {'player' | 'rain' | 'mud' | 'golden'} EntityTag
 */

/**
 * @typedef {object} GameState
 * @property {'ready' | 'running' | 'gameover'} status
 * @property {number} score
 * @property {number} missedDrops
 * @property {number} bucketLevel
 * @property {number} gauge
 * @property {number} bestLevel
 * @property {number} spawnTimer
 */

/**
 * @typedef {object} World
 * @property {number} nextId
 * @property {Set<number>} entities
 * @property {{ Position: Map<number, Position>, Velocity: Map<number, Velocity>, Size: Map<number, Size>, Tag: Map<number, EntityTag> }} components
 * @property {{ input: { left: boolean, right: boolean, pointerX: number|null, playerName: string }, game: GameState, config: object|null }} resources
 * @property {object[]} events
 */

/**
 * Creates an empty ECS world with default resources and empty component maps.
 *
 * @returns {World}
 */
export function createWorld() {
    return {
        nextId: 1,
        entities: new Set(),
        components: {
            Position: new Map(),
            Velocity: new Map(),
            Size: new Map(),
            Tag: new Map(),
        },
        resources: {
            input: {
                left: false,
                right: false,
                pointerX: null,
                playerName: 'Player',
            },
            game: {
                status: 'ready',
                score: 0,
                missedDrops: 0,
                bucketLevel: 0,
                gauge: 0,
                bestLevel: 0,
                spawnTimer: 0,
            },
            config: null,
        },
        events: [],
    };
}

/**
 * Adds a new entity id to the world and returns the updated world together
 * with the id that was created.
 *
 * @param {World} world
 * @returns {[World, number]}
 */
export function addEntity(world) {
    const entityId = world.nextId;

    return [
        {
            ...world,
            nextId: entityId + 1,
            entities: new Set([...world.entities, entityId]),
        },
        entityId,
    ];
}

/**
 * Removes an entity and all of its component data from the world.
 *
 * @param {World} world
 * @param {number} entityId
 * @returns {World}
 */
export function removeEntity(world, entityId) {
    const entities = new Set(world.entities);
    entities.delete(entityId);

    const nextComponents = {};
    for (const [componentName, componentMap] of Object.entries(world.components)) {
        const newMap = new Map(componentMap);
        newMap.delete(entityId);
        nextComponents[componentName] = newMap;
    }

    return {
        ...world,
        entities,
        components: nextComponents,
    };
}

/**
 * Adds or replaces one component value for a single entity.
 *
 * @param {World} world
 * @param {string} componentName
 * @param {number} entityId
 * @param {*} value
 * @returns {World}
 */
export function addComponent(world, componentName, entityId, value) {
    const componentMap = new Map(world.components[componentName]);
    componentMap.set(entityId, value);

    return {
        ...world,
        components: {
            ...world.components,
            [componentName]: componentMap,
        },
    };
}

/**
 * Updates part of an existing component by shallow-merging new values.
 *
 * @param {World} world
 * @param {string} componentName
 * @param {number} entityId
 * @param {object} changes
 * @returns {World}
 */
export function updateComponent(world, componentName, entityId, changes) {
    const currentValue = world.components[componentName].get(entityId) ?? {};
    const componentMap = new Map(world.components[componentName]);
    componentMap.set(entityId, { ...currentValue, ...changes });

    return {
        ...world,
        components: {
            ...world.components,
            [componentName]: componentMap,
        },
    };
}
