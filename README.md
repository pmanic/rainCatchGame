# rainCatcher

A simple ECS game written in JavaScript. The player moves a bucket, catches raindrops, avoids mud, and collects golden drops to recover lives.

## What the project demonstrates

- An ECS engine built in JavaScript
- Functional style: no world mutation, systems return a new `world`
- System composition through `runSystems(...)`
- Use of `map`, `filter`, and `reduce`
- The required systems from the assignment plus several additional game-specific systems

## Systems in the project

- `inputSystem`:
  keyboard, mouse, touch, and player name text input
- `renderSystem`:
  drawing the background, objects, and bucket
- `playerSystem`:
  player movement
- `spawnSystem`:
  creation of new falling objects
- `physicsSystem`:
  falling object movement
- `collisionSystem`:
  collision detection
- `cleanupSystem`:
  removing objects that leave the screen
- `progressionSystem`:
  score, lives, bucket level, and game over logic

## Functional programming principles

- Immutability:
  every change returns a new world object or a new component map
- Higher-order functions:
  `inputSystem(rawInput)` returns a system, and `reduce` executes the system list
- Function composition:
  all systems are executed in sequence inside a single loop
- `filter`:
  selecting entities that have the required components
- `reduce`:
  moving multiple entities, processing events, and running all systems

## Game rules

- Raindrop: `+1` point and fills the water gauge
- Mud drop: `-1` point and lowers the water gauge
- Golden drop: restores one lost cloud
- When the bucket fills up, it changes to a smaller size:
  Barrel -> Bucket -> Pail -> Tin
- If you miss 3 raindrops or the score drops to 0, the game ends

## Running the project

```bash
npm install
npm run build:css
```

After that, open `index.html` in a browser.
