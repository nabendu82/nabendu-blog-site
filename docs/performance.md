# Performance maintenance

## September 2026 changes

- Escape the Forest keeps one Canvas and one game session when entering or leaving fullscreen. Previously the inline game continued rendering behind a second fullscreen game.
- Sovereign Clash also keeps its Canvas mounted across fullscreen transitions.
- Forest plants are grouped into 24-metre spatial patches. Detailed nearby trees transition to simplified distant models; plant placements and maze collision data are unchanged. Shrub bark uses the lighter mesh at every distance.
- The three distant tree/shrub models use 1,325–1,328 triangles each, versus 6,556 in the originals (about 80% fewer). Leaf cards are enlarged when sampling them to retain foliage coverage. Each additional LOD asset is about 90 KB.
- Forest visibility/LOD checks run about seven times per second instead of every frame. The static scene is memoized, movement vectors are reused, and the minimap no longer resizes its backing canvas on every position update.
- Main-site 3D canvases cap device pixel ratio at 1.5 and can reduce it to 1 under sustained load. This changes rendering resolution, not simulation time.
- The homepage Spline animation stops when offscreen or when the document is hidden, and resumes when visible.
- Sovereign Clash rally-marker rendering visits only selected entities. DEAD//SHIFT memoizes actor components and avoids searching its enemy pool for each actor every frame.
- Blog filtering and pagination run on the server. The client receives only the displayed posts, and search navigation is debounced.
- Generated `.next-dev` output is excluded from Git tracking.

## Verification

The production build completed with lint and TypeScript checks. Build-reported first-load JavaScript changed from approximately 1.31 MB to 109 KB for `/blog`, and from 136 KB to 93.1 KB for `/games/escape-the-forest`. These are initial route bundles, not the total size of subsequently loaded 3D assets.

All 78 Sovereign Clash tests, 23 DEAD//SHIFT tests, and three forest asset integrity tests passed. Browser checks covered forest rendering, reset and fullscreen continuity; Sovereign Clash startup and fullscreen continuity; and blog search results. A forest fullscreen check showed exactly one WebGL canvas plus the minimap, and retained the countdown when exiting.

These checks do not establish an FPS improvement on every device or a multi-hour gameplay benchmark. The browser's development rendering counters are available through the game canvas's `data-render-stats` attribute; production builds omit this instrumentation.

## Regenerating forest LOD assets

Run `node scripts/build-forest-lod.mjs` after changing the original forest models, then `node --test tests/forest-assets.test.cjs`. The generator expects ez-tree's separate Bark/Leaves meshes and independent four-vertex leaf cards. It leaves the original models intact and writes `public/models/forest/*-lod.glb`.

Use `npm run build` to validate the integrated production build, including the standalone DEAD//SHIFT bundle. Development uses `.next-dev`; production uses `.next`. Stop a production server before rebuilding its `.next` directory.
