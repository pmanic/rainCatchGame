// assets.js — Loads all game images/sprites before the loop starts.

/** Paths to every sprite and background image keyed by asset name. */
const SPRITE_PATHS = {
  blood:      'src/assets/sprites/blood-drop.svg',
  water:      'src/assets/sprites/water-drop.svg',
  wetWipe:    'src/assets/sprites/wet-wipe.svg',
  pad:        'src/assets/sprites/pad.svg',
  background: 'src/assets/images/background.svg',
};

/**
 * Loads a single image from `src` and returns a promise that resolves
 * to the loaded `HTMLImageElement`.
 * @param {string} src - URL or path to the image file.
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image    = new Image();
    image.onload   = () => resolve(image);
    image.onerror  = () => reject(new Error(`Failed to load asset: ${src}`));
    image.src = src;
  });
}

/**
 * Loads all game sprites in parallel.
 * @returns {Promise<Record<string, HTMLImageElement>>} Map of asset name → loaded image.
 */
export async function loadAssets() {
  const loadedEntries = await Promise.all(
    Object.entries(SPRITE_PATHS).map(async ([assetName, path]) => [
      assetName,
      await loadImage(path),
    ])
  );
  return Object.fromEntries(loadedEntries);
}
