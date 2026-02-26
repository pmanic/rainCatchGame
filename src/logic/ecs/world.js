// world.js — ECS world factory and core entity/component operations.
// All functions return a new world; nothing mutates in place.

/**
 * @typedef {{ x: number, y: number }} Position
 * @typedef {{ vx: number, vy: number }} Velocity
 * @typedef {{ w: number, h: number }} Size
 * @typedef {'player' | 'blood' | 'wetWipe' | 'water'} EntityTag
 */

/**
 * @typedef {object} GameState
 * @property {'running' | 'gameover'} status
 * @property {number} score        - Player's current score.
 * @property {number} missedDrops  - Number of blood drops missed so far.
 * @property {number} padLevel     - Index into config.padLevels (0 = Maxi).
 * @property {number} gauge        - Fill progress toward the next pad level.
 * @property {number} bestLevel    - Highest pad level reached this run.
 * @property {number} spawnTimer   - Accumulated time since the last spawn.
 * @property {number} padShake     - Remaining seconds of the pad shake effect.
 */

/**
 * @typedef {object} World
 * @property {number}   nextId     - Counter used to assign unique entity IDs.
 * @property {Set<number>} entities - All active entity IDs.
 * @property {{ Position: Map<number, Position>, Velocity: Map<number, Velocity>, Size: Map<number, Size>, Tag: Map<number, EntityTag> }} components
 * @property {{ input: { left: boolean, right: boolean, pointerX: number|null }, game: GameState, config: object|null }} resources
 * @property {object[]} events     - Transient events emitted this frame; cleared each tick.
 */

/**
 * Creates a fresh, empty world with default resource values.
 * @returns {World}
 */
export function createWorld() {
  return {
    nextId: 1,
    entities: new Set(),
    components: {
      Position: new Map(),
      Velocity: new Map(),
      Size:     new Map(),
      Tag:      new Map(),
    },
    resources: {
      input:  { left: false, right: false, pointerX: null },
      game: {
        status:      'running', // 'running' | 'gameover'
        score:       0,
        missedDrops: 0,
        padLevel:    0,         // index into config.padLevels
        gauge:       0,
        bestLevel:   0,
        spawnTimer:  0,
        padShake:    0,
      },
      config: null, // populated by initWorld()
    },
    events: [],
  };
}

/**
 * Adds a new entity to the world and returns the updated world along with the new entity ID.
 * @param {World} world
 * @returns {[World, number]} Tuple of the new world and the assigned entity ID.
 */
export function addEntity(world) {
  const entityId = world.nextId;
  return [
    {
      ...world,
      nextId:   entityId + 1,
      entities: new Set([...world.entities, entityId]),
    },
    entityId,
  ];
}

/**
 * Removes an entity and all its associated component data from the world.
 * @param {World} world
 * @param {number} entityId
 * @returns {World}
 */
export function removeEntity(world, entityId) {
  const entities = new Set(world.entities);
  entities.delete(entityId);

  const components = Object.fromEntries(
    Object.entries(world.components).map(([componentName, componentMap]) => {
      const updatedMap = new Map(componentMap);
      updatedMap.delete(entityId);
      return [componentName, updatedMap];
    })
  );

  return { ...world, entities, components };
}

/**
 * Adds or replaces a component value for the given entity.
 * @param {World} world
 * @param {string} componentName
 * @param {number} entityId
 * @param {*} value
 * @returns {World}
 */
export function addComponent(world, componentName, entityId, value) {
  const updatedMap = new Map(world.components[componentName]);
  updatedMap.set(entityId, value);
  return {
    ...world,
    components: { ...world.components, [componentName]: updatedMap },
  };
}

/**
 * Updates a component by shallowly merging `partial` into the existing value.
 * @param {World} world
 * @param {string} componentName
 * @param {number} entityId
 * @param {object} partial
 * @returns {World}
 */
export function updateComponent(world, componentName, entityId, partial) {
  const existing   = world.components[componentName].get(entityId) ?? {};
  const updatedMap = new Map(world.components[componentName]);
  updatedMap.set(entityId, { ...existing, ...partial });
  return {
    ...world,
    components: { ...world.components, [componentName]: updatedMap },
  };
}
