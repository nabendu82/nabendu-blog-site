// Run with node scripts/build-forest-lod.mjs. Originals remain the close-up models.
import fs from 'node:fs';
import { MeshoptSimplifier } from 'meshoptimizer';

await MeshoptSimplifier.ready;
for (const kind of ['canopy', 'understory', 'shrub']) {
  const source = fs.readFileSync(`public/models/forest/${kind}.glb`);
  const jsonLength = source.readUInt32LE(12);
  const gltf = JSON.parse(source.subarray(20, 20 + jsonLength));
  const bin = source.subarray(28 + jsonLength);
  const sourceAccessors = gltf.accessors, sourceViews = gltf.bufferViews;
  gltf.accessors = []; gltf.bufferViews = [];
  const chunks = [];
  let length = 0;
  const components = type => type === 'VEC3' ? 3 : type === 'VEC2' ? 2 : 1;
  function read(index) {
    const a = sourceAccessors[index], view = sourceViews[a.bufferView];
    const Type = a.componentType === 5126 ? Float32Array : a.componentType === 5125 ? Uint32Array : Uint16Array;
    const start = (view.byteOffset || 0) + (a.byteOffset || 0);
    return new Type(bin.buffer.slice(bin.byteOffset + start, bin.byteOffset + start + a.count * components(a.type) * Type.BYTES_PER_ELEMENT));
  }
  function append(data, type, componentType) {
    const bytes = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    const padded = Buffer.alloc(Math.ceil(bytes.length / 4) * 4);
    bytes.copy(padded);
    const bufferView = gltf.bufferViews.push({ buffer: 0, byteOffset: length, byteLength: bytes.length }) - 1;
    chunks.push(padded); length += padded.length;
    const accessor = { bufferView, componentType, count: data.length / components(type), type };
    if (type === 'VEC3') {
      accessor.min = [Infinity, Infinity, Infinity]; accessor.max = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < data.length; i++) {
        accessor.min[i % 3] = Math.min(accessor.min[i % 3], data[i]);
        accessor.max[i % 3] = Math.max(accessor.max[i % 3], data[i]);
      }
    }
    return gltf.accessors.push(accessor) - 1;
  }
  for (const node of gltf.nodes) {
    if (node.mesh === undefined) continue;
    for (const p of gltf.meshes[node.mesh].primitives) {
      const indices = Uint32Array.from(read(p.indices));
      const positions = read(p.attributes.POSITION);
      let reduced;
      if (node.name === 'Bark') {
        [reduced] = MeshoptSimplifier.simplify(indices, positions, 3, 1200, .03);
      } else {
        // ez-tree exports independent four-vertex leaf cards. Keep every third
        // card and enlarge it to preserve foliage coverage at a distance.
        if (indices.length % 6 || positions.length / 3 !== indices.length / 6 * 4) throw new Error('Unexpected leaf topology');
        const kept = [];
        for (let i = 0; i < indices.length; i += 18) {
          const card = [...new Set(indices.slice(i, i + 6))];
          if (card.length !== 4) throw new Error('Expected a leaf quad');
          for (let axis = 0; axis < 3; axis++) {
            const center = card.reduce((sum, v) => sum + positions[v * 3 + axis], 0) / 4;
            for (const v of card) positions[v * 3 + axis] = center + (positions[v * 3 + axis] - center) * Math.sqrt(3);
          }
          kept.push(...indices.slice(i, i + 6));
        }
        reduced = Uint32Array.from(kept);
      }
      const remap = new Map();
      const packedIndices = Uint32Array.from(reduced, old => {
        if (!remap.has(old)) remap.set(old, remap.size);
        return remap.get(old);
      });
      for (const [semantic, accessorIndex] of Object.entries(p.attributes)) {
        const a = sourceAccessors[accessorIndex];
        const values = semantic === 'POSITION' ? positions : read(accessorIndex);
        const stride = components(a.type);
        const packed = new Float32Array(remap.size * stride);
        for (const [old, next] of remap) packed.set(values.subarray(old * stride, (old + 1) * stride), next * stride);
        p.attributes[semantic] = append(packed, a.type, 5126);
      }
      p.indices = append(packedIndices, 'SCALAR', 5125);
      console.log(`${kind} ${node.name}: ${indices.length / 3} → ${reduced.length / 3} triangles`);
    }
  }
  gltf.buffers[0].byteLength = length;
  const json = Buffer.from(JSON.stringify(gltf));
  const paddedJson = Buffer.alloc(Math.ceil(json.length / 4) * 4, 32); json.copy(paddedJson);
  const header = Buffer.alloc(20); header.writeUInt32LE(0x46546c67); header.writeUInt32LE(2, 4);
  header.writeUInt32LE(28 + paddedJson.length + length, 8); header.writeUInt32LE(paddedJson.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
  const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(length); binHeader.writeUInt32LE(0x004e4942, 4);
  fs.writeFileSync(`public/models/forest/${kind}-lod.glb`, Buffer.concat([header, paddedJson, binHeader, ...chunks]));
}
