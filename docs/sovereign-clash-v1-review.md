# Sovereign Clash v1 release review

## Fixed

- Repeated attack commands no longer shorten weapon cooldowns. This closes a rapid-fire exploit, including Pinaka salvos.
- Elephant trample respects target restrictions and cannot damage helicopters.
- Defensive towers skip aircraft they cannot attack, allowing them to engage valid ground targets.
- Projectiles retain their original air/ground target layer. An anti-air explosion cannot switch to ground damage when its target is removed before impact.
- The Medium Modern raid countdown uses the same 162-second interval as the simulation.
- Camera key and middle-drag state clears when the window loses focus, preventing stuck panning.
- Help no longer claims a nonexistent 100-population maximum; historical raid times are identified as Easy timings.

## Validation

- Automated game coverage: economy and resource delivery, age progression, civilization doctrines, training, combat, audio, transport loading/unloading, terrain routing, difficulty, and main Town Center victory conditions.
- New release regressions cover cooldown abuse, trample/air restrictions, tower targeting and anti-air projectile cleanup.
- Late-game smoke scenario: four terrain/civilization pairings, 70 added mixed modern troops per world, 30 simulated seconds starting at the three-hour game clock; checks finite entity values, nonnegative resources and no spurious match result.
- Production build includes TypeScript and lint validation.
- Browser smoke checks: empire/difficulty/sea selection, fullscreen rendering, Main Town Center selection, villager training cost and queue, help pause/resume; no console warnings or errors observed.

The late-game scenario is a short accelerated-state smoke check, not a continuous three-hour playthrough or a frame-rate benchmark. Release review cannot guarantee the absence of all bugs. No deployment or release tag was created by this review.
