# Rooftop Rush: Neo India

A polished browser-based 3D infinite runner. You control a small futuristic courier robot sprinting across the
rooftops of a colourful, fictional Indian megacity at sunset – dodging AC units, overhead signs, water tanks,
cleaning robots, broken rooftop gaps and drone barriers while collecting energy cells and power-ups.

The courier uses a custom Blender-authored GLB with articulated parts. The city, obstacles, effects and sound remain procedural. Blender is only needed to edit the character, not to run the game.

**Stack:** Vite · React 18 · TypeScript · Three.js · React Three Fiber · Drei · Zustand · CSS (HUD/menus) · Web Audio API.

## Run it

```bash
npm install
npm run dev          # http://127.0.0.1:5192  (add `-- --host` to test on a phone on your LAN)
npm run build        # type-checks (tsc) and creates the site embed in ../../public/games/rooftop-rush/embed/
npm run preview      # serve the production build
```

Requires Node 18+.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Change lane | `←` `→` or `A` `D` | Swipe left / right |
| Jump | `↑`, `W` or `Space` | Swipe up |
| Slide | `↓` or `S` (in the air: fast-fall, then slide) | Swipe down |
| Pause / resume | `P` or `Esc` | Pause button (top right) |
| Start / restart | `Enter` or `Space` | Start Run / Run Again button |
| Mute | Speaker button | Speaker button |

The game auto-pauses when the tab loses focus.

## Gameplay

- **Three lanes**, automatic forward movement, speed rising smoothly with distance (`baseSpeedAt`) up to a cap.
- **Obstacles** – each with a distinct visual language and required reaction:
  - Low AC units (orange hazard stripes) → **jump**
  - Overhead neon "DUCK" signs and pipe bundles → **slide**
  - Large water tanks (red/white base, beacon) → block a whole lane, **switch lane**
  - Cleaning robots and delivery drones → **sweep between two lanes** (jump / slide respectively)
  - Broken rooftop gaps with a **jump ramp** – the ramp auto-launches you over the gap (or jump manually)
- **Fair patterns** – see `src/game/spawner.ts`. Every row is passable by construction, rows are spaced ≥ 1.45 s of travel
  apart (≥ 28 m), and the first rows are single, easy obstacles with a long lead-in.
- **Energy cells** in lines, waves and jump arcs. Consecutive cells build a **combo multiplier** (x2 every 8 cells, up to x6);
  missing a cell in a chain resets it.
- **Power-ups** (pickup burst, HUD duration bars, flicker + toast + sound when they end):
  - **Magnet** (9 s) – pulls nearby cells to you
  - **Shield** (until hit, max 20 s) – absorbs one collision (also rescues you from a fall)
  - **Overdrive** (6.5 s) – +45 % speed, invulnerability, smashes obstacles, stronger trail / FOV / speed-lines
- **Score** = distance + cell bonuses (+ milestone bonuses). **High score** persists in `localStorage`.
  A toast fires every **500 m** and the level increments.
- Game over shows score, distance, energy and best; restart is instant (`Enter` / `Space` / button).

## Architecture

```
src/
  main.tsx, App.tsx          entry + input/audio wiring, auto-pause
  styles.css                 HUD, menus, loading screen (pure CSS)
  components/
    GameCanvas.tsx           <Canvas>, per-frame loop, fog, dpr/AA settings
    HUD.tsx, Menus.tsx       in-game HUD, main menu, pause, game over, loading screen
  game/                      framework-agnostic game logic
    constants.ts             all tunables (lanes, speeds, physics, durations, palette)
    state.ts                 mutable per-frame state `G` (kept out of React on purpose)
    store.ts                 Zustand UI store (throttled HUD values, high score, mute, toasts)
    engine.ts                phases, player physics, collisions, scoring, power-ups, HUD sync
    spawner.ts               fair obstacle-row generator + energy-cell / power-up placement
    camera.ts                follow camera: lane smoothing, speed FOV, shake, menu showcase shot
    input.ts                 keyboard + swipe controller
    audio.ts                 procedural Web Audio SFX (unlocked on first user gesture)
  world/                     Three.js systems (plain classes; one owner each)
    world.ts                 aggregates systems; `scroll` group moved by the travelled distance
    builder.ts               merges primitives + vertex colours into one draw-call geometry
    materials.ts             shared materials + canvas-generated textures (floor, facades, neon signs)
    track.ts, props.ts       recycled rooftop segments + pooled rooftop props
    obstacles.ts             pooled obstacles (6 kinds)
    collectibles.ts          instanced energy cells + pooled power-up pickups
    player.ts                courier robot rig, pose blending, shield/magnet/overdrive visuals
    environment.ts           sky shader, sun, clouds, parallax skyline, temples, drones, lights
    particles.ts             pooled GPU point sprites (glow + dust)
```

### Key techniques

- **Track space**: the runner stays at the origin; everything else lives in a `scroll` group translated by the distance
  travelled, so recycling only needs `z = -s` placement.
- **Endless track**: 9 fixed-length segments form a ring; a segment that falls behind is moved to the far end and
  re-decorated from pooled props. Segment floors are butt-jointed on an underlying continuous slab, so there are no gaps.
- **Performance**: props/obstacles are merged, vertex-coloured meshes (1 draw call each) from object pools; energy cells
  and the skyline use `InstancedMesh`; particles are two `Points` draws; only the robot and obstacles cast shadows
  (one 1024² shadow map). Nothing is allocated during gameplay except transient math. Movement and animation use
  delta time; long frames are clamped and collisions are swept along Z so low frame rates never tunnel.
- **Robot animation**: a node hierarchy (hips → torso/head/arms, thigh → shin) with run / air / slide / death pose
  vectors blended by smoothed weights. A tiny analytic foot solver keeps the lowest foot on the ground, so the run cycle
  plants feet instead of skating. Lane changes lean and yaw the robot; landing squashes; hits flash and stagger.
- **Collision**: AABB vs. obstacle boxes with small forgiveness margins. Gaps are ground-height holes; ramps raise the
  ground height and launch the player at the end.
- **Audio**: oscillators + filtered noise; the `AudioContext` is created/resumed only from a user gesture.

## Validation performed

- `tsc --noEmit` and `vite build` pass with no errors.
- Browser checks: menu → run → pause → resume → game over → instant restart; keyboard (arrows / WASD / Space / P / Esc /
  Enter) and touch swipes (pointer events); high score written to and read back from `localStorage`; ~60 fps steady.
- Deterministic in-browser simulations (fast-forwarded `engine.update`) verified: tank / AC / sign / drone / robot
  collisions and the correct dodge for each, shield absorption, overdrive smashing + invulnerability + grace period,
  magnet pickup, combo multiplier, gap falls, ramp launches.
- Autopilot bot fairness soak: more than 30 simulated minutes at start, mid and maximum difficulty (with a limited
  reaction window) – zero deaths, ~20 km of continuous track recycling without errors.

## Limitations

- Bloom is approximated with additive glow sprites/halos rather than a post-processing pass (keeps mobile fast).
- Audio is sound effects only (no music loop).
- Devanagari neon text relies on the system font stack for glyph rendering (no font files are bundled).
