/**
 * Creates the input system that copies current raw DOM input into ECS resources.
 *
 * @param {{ left: boolean, right: boolean, pointerX: number|null, playerName: string }} rawInput
 * @returns {function(import('../ecs/world.js').World, number): import('../ecs/world.js').World}
 */
export function inputSystem(rawInput) {
    /**
     * Stores the latest input snapshot inside the immutable world state.
     *
     * @param {import('../ecs/world.js').World} world
     * @param {number} _dt
     * @returns {import('../ecs/world.js').World}
     */
    return function copyInputToWorld(world, _dt) {
        return {
            ...world,
            resources: {
                ...world.resources,
                input: {
                    ...rawInput,
                },
            },
        };
    };
}
