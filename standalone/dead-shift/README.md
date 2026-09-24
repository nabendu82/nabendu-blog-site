# DEAD//SHIFT — Mutation Run

Standalone Phase 1 browser game for the third game slot. It lives under `standalone/dead-shift` and has no imports from the existing games.

## Run

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal (the preferred development port is 5186). If that port is already in use, Vite automatically selects the next available port. `npm run build` creates a deployable `dist` folder; `npm run preview` serves that build on the preferred port 5187, with the same fallback behavior.

## Controls

- `WASD`: move with acceleration and deceleration
- Mouse: aim the survivor and rifle
- Left mouse button: fire the Scrap Rifle
- `Esc`: pause/resume
- `F3`: performance overlay
- `F4`: inspect character clips and the last live survivor motion telemetry
- `F5` (development server only): run isolated 0.75–3 m Walker shot checks and show ray origins and impacts

Rifle hits are resolved in the two-dimensional simulation against live enemy body circles and solid arena obstacles. The player body, visible weapon, decorative meshes, and helper objects are not shot colliders. The safe ray begins just ahead of the player's center, so a nearby Walker cannot be skipped by a muzzle that extends into its body. The visual tracer begins at the barrel unless the impact is closer than the barrel.

The game starts with eight Walkers and escalates through Runner, Tank, and Hazmat infected, with a fixed pool of up to 36 active enemies. Kills drop bio-energy and class DNA. Bio-energy drives in-run levels and three-card upgrades; level 5 unlocks one permanent weapon mutation for that run. Restart returns health, level, XP, DNA, weapon state, enemies, timers, pickups, and effects to a clean run.

## Phase 2 progression

- Walkers establish the opening pressure; Runners enter first, followed by Hazmat and Tank infected.
- XP shards pull toward the survivor inside the pickup radius and open a three-card upgrade choice at each level.
- Runner, Hazmat, and Tank kills can drop Volt, Fire, and Mass DNA. Elite Hazmat/Tank kills can also yield Cryo DNA.
- `THUNDERSTORM` is a rapid multi-barrel weapon with chain lightning.
- `HELLBREAKER` fires five heavy incendiary pellets with close-range explosions and burn damage.
- `ABSOLUTE ZERO` fires slow, high-damage rail shots that pierce and freeze infected in a line.
- Level-up, mutation selection, pause, death, and evolution presentation suspend simulation updates.

## Blender assets

The original source Blender scene is [art/dead-shift.blend](art/dead-shift.blend). Phase 2 characters and evolved weapons live in [art/phase2-characters-weapons.blend](art/phase2-characters-weapons.blend) and can be regenerated with [scripts/phase2_assets.py](scripts/phase2_assets.py). The environment kit remains in [art/visual-kit.blend](art/visual-kit.blend).

Exports are organized as:

- `public/assets/characters/survivor.glb` — rebuilt tactical scavenger with Idle, Run, Shoot, Hit, Death
- `public/assets/zombies/{walker,runner,tank,hazmat}.glb` — coherent infected family with Idle, Walk, Attack, Hit, Death
- `public/assets/weapons/scrap-rifle.glb` — named BARREL, CORE, MAGAZINE, UNDERBARREL, SIDE_MODULE, and Muzzle nodes
- `public/assets/weapons/{thunderstorm,hellbreaker,absolute-zero}.glb` — separate evolved weapon geometry and emissive cores
- `public/assets/environment/` — intersection, shop, abandoned car, barrier, dumpster, streetlight, and debris

## Validation

`npm test` covers the simulation and exported GLB structure. `npm run typecheck`, `npm run lint`, and `npm run build` are the release checks.

## Intentionally deferred

Bosses, permanent progression, infinite map chunks, crafting, saving, accounts, multiplayer, and mobile controls remain reserved for later phases.
