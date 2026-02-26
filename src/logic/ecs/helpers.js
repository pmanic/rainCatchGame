// helpers.js — Pure functional utilities used throughout the engine.

/**
 * Left-to-right function composition.
 * Each function receives the return value of the previous one.
 * @template T
 * @param {...function(T): T} fns - Functions to compose left-to-right.
 * @returns {function(T): T}
 * @example pipe(f, g, h)(x) === h(g(f(x)))
 */
export const pipe = (...fns) => initialValue =>
  fns.reduce((acc, fn) => fn(acc), initialValue);

/**
 * Right-to-left function composition.
 * @template T
 * @param {...function(T): T} fns - Functions to compose right-to-left.
 * @returns {function(T): T}
 * @example compose(f, g, h)(x) === f(g(h(x)))
 */
export const compose = (...fns) => initialValue =>
  fns.reduceRight((acc, fn) => fn(acc), initialValue);

/**
 * Returns a shallow copy of `obj` with `key` set to `value`.
 * @template T
 * @param {string} key
 * @param {*} value
 * @returns {function(T): T}
 */
export const assoc = (key, value) => obj => ({ ...obj, [key]: value });

/**
 * Immutably updates a nested path in an object using an updater function.
 * @param {string[]} path - Array of keys describing the nested path.
 * @param {function(*): *} updater - Receives the current value, returns the new value.
 * @returns {function(object): object}
 * @example updateIn(['a', 'b'], v => v + 1)({ a: { b: 1 } }) // => { a: { b: 2 } }
 */
export function updateIn(path, updater) {
  function descend(obj) {
    if (path.length === 0) return updater(obj);
    const [head, ...tail] = path;
    return { ...obj, [head]: updateIn(tail, updater)(obj[head] ?? {}) };
  }
  return descend;
}

/**
 * Returns a clamping function that constrains a number to [min, max] inclusive.
 * @param {number} min
 * @param {number} max
 * @returns {function(number): number}
 */
export const clamp = (min, max) => value => Math.min(max, Math.max(min, value));

/**
 * Returns a new world with `resources.game` shallowly merged with `partial`.
 * This is the standard way to update game state without mutating the world.
 * @param {import('./world.js').World} world
 * @param {Partial<import('./world.js').GameState>} partial
 * @returns {import('./world.js').World}
 */
export function updateGame(world, partial) {
  return {
    ...world,
    resources: {
      ...world.resources,
      game: { ...world.resources.game, ...partial },
    },
  };
}
