// Bake EZ Tree meshes once; browsers load compact GLBs, not the generator's texture bundle.
import fs from 'node:fs/promises';
import path from 'node:path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

THREE.TextureLoader.prototype.load = function () { return new THREE.Texture(); };
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(value => { this.result = value; this.onloadend?.(); }); }
};
const { Tree, LeafType, Billboard } = await import('@dgreenheck/ez-tree');
const output = path.resolve('public/models/forest');
await fs.mkdir(output, { recursive: true });
const report = [];
for (const [name, seed, length, width, leaf] of [
  ['canopy', 173, 16, 5.2, LeafType.Oak],
  ['understory', 827, 9, 3.2, LeafType.Ash],
  ['shrub', 312, 1.2, .75, LeafType.Ash],
]) {
  const tree = new Tree();
  const o = tree.options;
  o.seed = seed;
  o.bark.textured = false;
  o.branch.levels = 2;
  o.branch.length = { 0: length, 1: width, 2: width * .5, 3: 1 };
  o.branch.radius = { 0: name === 'canopy' ? .58 : name === 'understory' ? .28 : .06, 1: .55, 2: .45, 3: .2 };
  o.branch.children = { 0: 9, 1: 6, 2: 0 };
  o.branch.sections = { 0: 10, 1: 6, 2: 4, 3: 2 };
  o.branch.segments = { 0: 9, 1: 6, 2: 4, 3: 3 };
  o.branch.start = { 1: name === 'shrub' ? .2 : .48, 2: .2, 3: .3 };
  o.branch.gnarliness = { 0: .015, 1: .09, 2: .15, 3: .02 };
  o.branch.angle = { 1: 60, 2: 55, 3: 45 };
  o.leaves.type = leaf;
  o.leaves.billboard = Billboard.Double;
  o.leaves.count = 9;
  o.leaves.size = name === 'canopy' ? 2.5 : name === 'understory' ? 1.65 : .55;
  o.leaves.sizeVariance = .35;
  tree.generate();
  tree.branchesMesh.name = 'Bark';
  tree.leavesMesh.name = 'Leaves';
  // Textures are shared across every instance and supplied by the forest renderer.
  tree.branchesMesh.material.dispose();
  tree.leavesMesh.material.dispose();
  tree.branchesMesh.material = new THREE.MeshStandardMaterial({ roughness: .95 });
  tree.leavesMesh.material = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: .85 });
  const buffer = await new GLTFExporter().parseAsync(tree, { binary: true });
  await fs.writeFile(path.join(output, `${name}.glb`), Buffer.from(buffer));
  report.push({ name, seed, triangles: tree.triangleCount, bytes: buffer.byteLength });
}
for (const [source, target] of [
  ['bark/oak_color_1k.jpg', 'bark.jpg'],
  ['bark/oak_normal_1k.jpg', 'bark-normal.jpg'],
  ['leaves/oak_color.png', 'oak-leaves.png'],
  ['leaves/ash_color.png', 'ash-leaves.png'],
]) await fs.copyFile(`node_modules/@dgreenheck/ez-tree/src/lib/assets/${source}`, path.join(output, target));
await fs.copyFile('node_modules/@dgreenheck/ez-tree/LICENSE', path.join(output, 'EZ-TREE-LICENSE.txt'));
console.log(JSON.stringify(report, null, 2));
