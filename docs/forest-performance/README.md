# Escape the Forest performance notes

The forest keeps its existing models, textures, density, lighting style, and gameplay. The runtime changes reduce work performed while the player is moving:

- Vegetation chunks now share one visibility pass rather than registering a separate `useFrame` callback for every chunk.
- Instanced vegetation keeps its matrices static after placement, so React Three Fiber does not reconsider them each frame.
- The 14 decorative lanterns still render everywhere, while only the four closest point lights are active. The warm lantern appearance is preserved without evaluating all lights continuously.
- The forest audio teardown captures the old oscillator session before fading it out. Rapid mute/unmute cycles cannot leave duplicate audio nodes playing.
- The minimap/player HUD is isolated from the WebGL canvas configuration, preventing position updates from resetting adaptive pixel density.

The captured browser stats improved from roughly 2.76 million triangles / 231 draw calls to 2.41 million triangles / 182 draw calls at the tested view, with a measured 17 ms frame time after sustained movement. Preview screenshots are stored beside this note and in `public/games/` for the Games hub cards.
