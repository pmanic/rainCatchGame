const ITEM_FALLBACK_COLOR = {
    rain: '#439dff',
    mud: '#8d6e63',
    golden: '#ffd54f',
};

/**
 * Returns all non-player entities that should be rendered as falling objects.
 *
 * @param {import('../ecs/world.js').World} world
 * @returns {number[]}
 */
function getFallingEntityIds(world) {
    return [...world.components.Tag.entries()]
        .filter(([entityId, tag]) => {
            return tag !== 'player' &&
                world.components.Position.has(entityId) &&
                world.components.Size.has(entityId);
        })
        .map(([entityId]) => entityId);
}

/**
 * Finds the player bucket entity id.
 *
 * @param {import('../ecs/world.js').World} world
 * @returns {number|null}
 */
function findPlayerId(world) {
    for (const [entityId, tag] of world.components.Tag.entries()) {
        if (
            tag === 'player' &&
            world.components.Position.has(entityId) &&
            world.components.Size.has(entityId)
        ) {
            return entityId;
        }
    }

    return null;
}

/**
 * Creates the rendering system bound to the canvas context and loaded assets.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Record<string, HTMLImageElement>} assets
 * @returns {function(import('../ecs/world.js').World, number): import('../ecs/world.js').World}
 */
export function renderSystem(ctx, assets) {
    /**
     * Draws a single game frame using a plain white background.
     *
     * @param {import('../ecs/world.js').World} world
     * @param {number} _dt
     * @returns {import('../ecs/world.js').World}
     */
    return function drawFrame(world, _dt) {
        const { width, height } = world.resources.config.canvas;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        const fallingEntities = getFallingEntityIds(world);

        fallingEntities.forEach(entityId => {
            const position = world.components.Position.get(entityId);
            const size = world.components.Size.get(entityId);
            const tag = world.components.Tag.get(entityId);
            const image = assets[tag];

            if (image) {
                ctx.drawImage(image, position.x, position.y, size.w, size.h);
            } else {
                ctx.fillStyle = ITEM_FALLBACK_COLOR[tag] ?? '#000000';
                ctx.fillRect(position.x, position.y, size.w, size.h);
            }
        });

        const playerId = findPlayerId(world);
        if (playerId != null) {
            const bucketPosition = world.components.Position.get(playerId);
            const bucketSize = world.components.Size.get(playerId);

            if (assets.bucket) {
                ctx.drawImage(assets.bucket, bucketPosition.x, bucketPosition.y, bucketSize.w, bucketSize.h);
            } else {
                ctx.fillStyle = '#a8dcff';
                ctx.fillRect(bucketPosition.x, bucketPosition.y, bucketSize.w, bucketSize.h);
            }
        }

        return world;
    };
}
