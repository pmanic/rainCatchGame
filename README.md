# flowMaster

A browser-based arcade game. Catch falling blood drops with your pad, dodge wet wipes, and grab water droplets to restore lives — all while your pad shrinks as it fills up.

---

## Gameplay

Use your pad to catch items falling from the top of the screen:

| Item | Effect |
|---|---|
| 🩸 Blood drop | +1 score, fills the pad gauge |
| 🧻 Wet wipe | −1 score, drains gauge |
| 💧 Water drop | Restores 1 missed life |

**Pad levels** — as your gauge fills, the pad shrinks: Maxi → Normal → Slim → Mini.
Miss 3 blood drops or drain your score to zero and it's game over.

## Controls

| Input | Action |
|---|---|
| `← →` or `A / D` | Move pad |
| Mouse | Pad follows cursor |
| Touch / drag | Mobile support |

## Running locally

```bash
npm install        # first time only (installs sass)
npm run build:css  # compile SCSS → CSS
```

Then open `index.html` directly in a browser. No server needed.

## Stack

Vanilla JavaScript — no frameworks, no bundler. Built with an Entity-Component-System (ECS) architecture and functional programming principles. Styles authored in SCSS.
