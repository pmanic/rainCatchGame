// inputSystem.js — Copies raw keyboard/pointer state into world resources each frame.
// The raw input object is owned and mutated by DOM event listeners in main.js.

/**
 * Returns a system function that snapshots `rawInput` into `resources.input`.
 * Wrapping the mutable raw object in a system keeps the rest of the pipeline pure.
 *
 * @param {{ left: boolean, right: boolean, pointerX: number|null }} rawInput
 *   Live input state maintained by DOM event listeners.
 * @returns {function(import('../ecs/world.js').World, number): import('../ecs/world.js').World}
 */
export function inputSystem(rawInput) {
  return function captureInput(world, _dt) {
    return {
      ...world,
      resources: {
        ...world.resources,
        input: { ...rawInput },
      },
    };
  };
}
