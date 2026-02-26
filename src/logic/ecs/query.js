// query.js — Query entities that possess all specified components.

/**
 * Returns an array of entity IDs that have every listed component.
 * Starts from the first (often smallest) component map and filters
 * to entities present in all remaining maps.
 *
 * @param {import('./world.js').World} world
 * @param {...string} componentNames - Names of components the entity must possess.
 * @returns {number[]} Entity IDs matching all specified components.
 */
export function query(world, ...componentNames) {
  if (componentNames.length === 0) return [...world.entities];

  const [firstComponent, ...remainingComponents] = componentNames;
  const firstMap = world.components[firstComponent];
  if (!firstMap) return [];

  return [...firstMap.keys()].filter(entityId =>
    remainingComponents.every(componentName =>
      world.components[componentName]?.has(entityId)
    )
  );
}
