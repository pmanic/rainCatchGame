// progressionSystem.js — Processes frame events to update score, gauge, pad level, and game-over.

import { query }                   from '../ecs/query.js';
import { updateComponent }         from '../ecs/world.js';
import { updateGame, clamp }       from '../ecs/helpers.js';

/** Duration in seconds of the pad shake effect triggered by catching a wet wipe. */
const PAD_SHAKE_DURATION = 0.4;

/**
 * Applies the effect of a single 'collected' event to the world.
 *
 * @param {import('../ecs/world.js').World} world
 * @param {{ type: string, tag: import('../ecs/world.js').EntityTag }} event
 * @param {object} config - Game config from world resources.
 * @returns {import('../ecs/world.js').World}
 */
function applyCollectedEvent(world, event, config) {
  const game = world.resources.game;

  if (event.tag === 'blood') {
    return updateGame(world, { score: game.score + 1, gauge: game.gauge + 1 });
  }

  if (event.tag === 'wetWipe') {
    const penalisedScore = Math.max(0, game.score - 1);
    const penalisedGauge = Math.max(0, game.gauge - 2);
    const nextStatus     = (game.score > 0 && penalisedScore === 0) ? 'gameover' : game.status;
    return updateGame(world, {
      score:    penalisedScore,
      gauge:    penalisedGauge,
      status:   nextStatus,
      padShake: PAD_SHAKE_DURATION,
    });
  }

  if (event.tag === 'water') {
    // Restore one missed life, floored at 0.
    const restoredMissCount = clamp(0, config.maxMisses)(game.missedDrops - 1);
    return updateGame(world, { missedDrops: restoredMissCount });
  }

  return world;
}

/**
 * Processes all events from the current frame, then checks for game-over and
 * pad level advancement. Clears the events array before returning.
 *
 * @param {import('../ecs/world.js').World} world
 * @param {number} dt - Delta time in seconds.
 * @returns {import('../ecs/world.js').World}
 */
export function progressionSystem(world, dt) {
  const { game, config } = world.resources;

  // Tick down the pad shake timer
  world = game.padShake > 0
    ? updateGame(world, { padShake: Math.max(0, game.padShake - dt) })
    : world;

  // Apply every collected-item event accumulated this frame
  const worldAfterEvents = world.events.reduce((accWorld, event) => {
    if (event.type === 'collected') {
      return applyCollectedEvent(accWorld, event, config);
    }
    return accWorld;
  }, world);

  // Clear the event queue for the next frame
  let clearedWorld = { ...worldAfterEvents, events: [] };
  const currentGame = clearedWorld.resources.game;

  // Check game-over: all lives exhausted
  if (currentGame.missedDrops >= config.maxMisses) {
    return updateGame(clearedWorld, { status: 'gameover' });
  }

  // Check pad level advancement: gauge filled
  const currentLevelData = config.padLevels[currentGame.padLevel];
  if (currentGame.gauge >= currentLevelData.capacity) {
    const nextLevelIndex = Math.min(currentGame.padLevel + 1, config.padLevels.length - 1);
    const newBestLevel   = Math.max(currentGame.bestLevel, nextLevelIndex);
    const levelAdvanced  = nextLevelIndex !== currentGame.padLevel;

    if (levelAdvanced) {
      const [playerId] = query(clearedWorld, 'Tag').filter(
        entityId => clearedWorld.components.Tag.get(entityId) === 'player'
      );
      if (playerId != null) {
        clearedWorld = updateComponent(
          clearedWorld, 'Size', playerId,
          { w: config.padLevels[nextLevelIndex].width }
        );
      }
    }

    return updateGame(clearedWorld, {
      padLevel:  nextLevelIndex,
      bestLevel: newBestLevel,
      gauge:     levelAdvanced ? 0 : currentGame.gauge,
    });
  }

  return clearedWorld;
}
