# Monsoon forest assets

Tree geometry and bark/leaf textures use Daniel Greenheck's [EZ Tree](https://github.com/dgreenheck/ez-tree), version 1.1.0, under the MIT license included in `EZ-TREE-LICENSE.txt`.

Run `node scripts/generate-forest-trees.mjs` from the repository root to regenerate the three seeded GLBs and shared textures. These are broadleaf artistic variants, not botanical reconstructions of Sal or Teak. The application loads the generated assets rather than shipping the generator and all of its embedded textures to players.

`fern-rock.glb` is original project artwork created in the connected Blender 5.2 scene: `Monsoon_Fern_Cluster` and `Monsoon_Moss_Rock`. The source generator is `scripts/blender-forest-floor.py`. It adds a separate collection and exports only the new objects, preserving the existing Torii scene. Adjust its export path when running on another machine.

The renderer shares geometry, materials and textures across instances, updates nearby instance lists after camera movement, and excludes trees beyond 115 m (hidden by fog at 100 m). Ferns are limited to 80 m. Existing maze placement, trunk collision, pond and escape routes are retained. Leaf wind is a small vertex displacement; full dynamic canopy shadows are intentionally avoided for browser performance.
