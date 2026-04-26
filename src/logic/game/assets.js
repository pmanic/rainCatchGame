const SPRITE_PATHS = {
    rain: 'src/assets/sprites/rain-drop.svg',
    golden: 'src/assets/sprites/golden-drop.svg',
    mud: 'src/assets/sprites/mud-drop.svg',
    bucket: 'src/assets/sprites/bucket.svg',
    background: 'src/assets/images/background.svg',
};

/**
 * Loads one image file and resolves when the browser finishes decoding it.
 *
 * @param {string} src
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Failed to load asset: ${src}`));
        image.src = src;
    });
}

/**
 * Loads all game images and returns them in one object keyed by asset name.
 *
 * @returns {Promise<Record<string, HTMLImageElement>>}
 */
export async function loadAssets() {
    const loadedEntries = await Promise.all(
        Object.entries(SPRITE_PATHS).map(async ([assetName, path]) => {
            return [assetName, await loadImage(path)];
        })
    );

    return Object.fromEntries(loadedEntries);
}
