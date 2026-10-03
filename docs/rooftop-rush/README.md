# Rooftop Rush integration

Imported from /Users/nabendubiswas/Desktop/Projects/subway-surfer/3D-sonnet-5.5. The original directory is unchanged; edit the integrated copy in standalone/rooftop-rush for website updates.

## Run and build
From the repository root, npm run dev builds both standalone games and starts Next.js. Open /games/rooftop-rush. npm run build produces both game embeds and the production website; CI installs each standalone game's pinned dependencies. To rebuild only this embed, run npm run build:rooftop-rush.

Integration includes the Games hub, desktop/mobile navigation, sitemap, metadata, instructions, mute synchronization and fullscreen without restarting the iframe.

## Character
Created through the connected live Blender MCP in a separate ROOFTOP_RUSH_COURIER scene, preserving existing scenes. Source: courier.blend; preview: courier-preview.png; creation script: ../../scripts/blender/build-rooftop-courier.py. Runtime model: ../../standalone/rooftop-rush/public/models/courier.glb (349 KB, 13,608 triangles, 12 articulated parts).
The imported geometry is converted from its bind pose into the game's existing animation pivots. Run, jump, slide and hit effects retain the original behavior. A procedural fallback remains if the GLB fails to load.

To export after editing, select the twelve Courier_* meshes in the courier scene and export GLB with Selected Objects, Active Scene, +Y Up, without animations. Save over the runtime model then rebuild the embed.

## Controls
A/D or Left/Right: lanes. W/Up/Space: jump. S/Down: slide. P/Escape: pause. Touch: directional swipes. Enter: start/restart. Escape also exits the site's fullscreen view. Best score and sound preference are saved locally.

## Verification (2026-10-02)
- Standalone TypeScript/Vite build and full npm run build passed.
- Root TypeScript check and git diff whitespace check passed.
- Browser verified loaded Blender courier, lane change/jump, pause/resume/restart, fullscreen preserving the run, two-way mute and persisted mute after reload.
- Games hub, desktop dropdown, mobile navigation and 390px mobile layout checked.
- Export validated as one scene with 12 named Courier parts; built model matches source byte-for-byte.
- Gameplay screenshot: gameplay.jpg. Original external game directory is unchanged.
