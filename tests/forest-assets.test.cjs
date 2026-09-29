const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

for (const kind of ['canopy', 'understory', 'shrub']) {
  test(`${kind} distance model has valid geometry, bounds and fewer triangles`, () => {
    const file = fs.readFileSync(`public/models/forest/${kind}-lod.glb`);
    assert.equal(file.readUInt32LE(8), file.length);
    const size = file.readUInt32LE(12);
    const gltf = JSON.parse(file.subarray(20, 20 + size));
    const bin = file.subarray(28 + size);
    let triangles = 0;
    assert.deepEqual(gltf.nodes.filter(n => n.mesh !== undefined).map(n => n.name), ['Bark', 'Leaves']);
    for (const mesh of gltf.meshes) for (const p of mesh.primitives) {
      const positions = gltf.accessors[p.attributes.POSITION];
      assert.equal(positions.count, gltf.accessors[p.attributes.NORMAL].count);
      assert.equal(positions.count, gltf.accessors[p.attributes.TEXCOORD_0].count);
      const view = gltf.bufferViews[positions.bufferView];
      for (let i = 0; i < positions.count * 3; i++) {
        const value = bin.readFloatLE(view.byteOffset + i * 4);
        assert.ok(Number.isFinite(value));
        assert.ok(value >= positions.min[i % 3] && value <= positions.max[i % 3]);
      }
      const index = gltf.accessors[p.indices];
      const indices = gltf.bufferViews[index.bufferView];
      assert.equal(index.count % 3, 0);
      for (let i = 0; i < index.count; i++) assert.ok(bin.readUInt32LE(indices.byteOffset + i * 4) < positions.count);
      triangles += index.count / 3;
    }
    assert.ok(triangles < 1500, `LOD budget exceeded: ${triangles}`);
  });
}
