"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useTexture } from '@react-three/drei';
import { BufferGeometry, Color, DoubleSide, InstancedMesh, Material, Mesh, MeshStandardMaterial, Object3D, RepeatWrapping, SRGBColorSpace } from 'three';
import { JUNGLE_LAYOUT } from './maze';

type Placement = { x: number; z: number; height: number; width: number; yaw: number; tint: Color };
const ROOT = '/models/forest/';
const groundHeight = (x: number, z: number) => Math.sin(x * .08) * Math.cos(z * .08) * .35;

// Keep a compact instance buffer around the player. Fog conceals the outer boundary;
// matrices update only after movement, and computed bounds allow normal frustum culling.
function NearbyInstances({ geometry, material, items, radius }: { geometry: BufferGeometry; material: Material | Material[]; items: Placement[]; radius: number }) {
  const ref = useRef<InstancedMesh>(null);
  const state = useMemo(() => ({ x: Infinity, z: Infinity, elapsed: 1, dummy: new Object3D() }), []);
  useLayoutEffect(() => { if (ref.current) ref.current.count = 0; state.x = Infinity; state.z = Infinity; }, [geometry, material, items, state]);
  useFrame(({ camera }, dt) => {
    state.elapsed += dt;
    if (state.elapsed < .25 || Math.hypot(camera.position.x - state.x, camera.position.z - state.z) < 2) return;
    state.elapsed = 0; state.x = camera.position.x; state.z = camera.position.z;
    const mesh = ref.current;
    if (!mesh) return;
    let count = 0;
    for (const item of items) {
      if ((item.x - state.x) ** 2 + (item.z - state.z) ** 2 > radius ** 2) continue;
      state.dummy.position.set(item.x, groundHeight(item.x, item.z) - .06, item.z);
      state.dummy.rotation.set(0, item.yaw, 0);
      state.dummy.scale.set(item.width, item.height, item.width);
      state.dummy.updateMatrix();
      mesh.setMatrixAt(count, state.dummy.matrix);
      mesh.setColorAt(count, item.tint);
      count++;
    }
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  });
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} receiveShadow frustumCulled={false} dispose={null} />;
}

function TreeLayer({ kind, items, bark, foliage }: { kind: string; items: Placement[]; bark: Material; foliage: Material }) {
  const model = useGLTF(`${ROOT}${kind}.glb`);
  const branches = model.nodes.Bark as Mesh;
  const leaves = model.nodes.Leaves as Mesh;
  return <>
    <NearbyInstances geometry={branches.geometry} material={bark} items={items} radius={135} />
    <NearbyInstances geometry={leaves.geometry} material={foliage} items={items} radius={135} />
  </>;
}

export function ForestVegetation() {
  const [barkMap, barkNormal, oakMap, ashMap] = useTexture([`${ROOT}bark.jpg`, `${ROOT}bark-normal.jpg`, `${ROOT}oak-leaves.png`, `${ROOT}ash-leaves.png`]);
  const wind = useMemo(() => ({ value: 0 }), []);
  const materials = useMemo(() => {
    barkMap.colorSpace = SRGBColorSpace;
    barkMap.wrapS = barkMap.wrapT = RepeatWrapping;
    barkNormal.wrapS = barkNormal.wrapT = RepeatWrapping;
    const bark = new MeshStandardMaterial({ map: barkMap, normalMap: barkNormal, roughness: .95, color: '#aaa38b' });
    const leaves = [oakMap, ashMap].map(map => {
      map.colorSpace = SRGBColorSpace;
      const material = new MeshStandardMaterial({ map, side: DoubleSide, alphaTest: .45, roughness: .85, color: '#b4c88c' });
      material.onBeforeCompile = shader => {
        shader.uniforms.forestTime = wind;
        shader.vertexShader = 'uniform float forestTime;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
          #include <begin_vertex>
          float phase = forestTime * 0.8 + instanceMatrix[3].x * 0.23 + instanceMatrix[3].z * 0.31;
          transformed.x += sin(phase + position.y * 1.4) * min(position.y * 0.008, 0.12);
          transformed.z += cos(phase * 0.7 + position.x) * min(position.y * 0.005, 0.08);
        `);
      };
      material.customProgramCacheKey = () => 'forest-leaf-wind-v1';
      return material;
    });
    return { bark, leaves };
  }, [barkMap, barkNormal, oakMap, ashMap, wind]);
  useEffect(() => () => { materials.bark.dispose(); materials.leaves.forEach(m => m.dispose()); }, [materials]);
  const placements = useMemo(() => {
    const canopy = JUNGLE_LAYOUT.canopyTrees.map((t, i) => ({ x: t.x, z: t.z, width: t.scale * 1.12, height: t.height / 15, yaw: t.rotY, tint: new Color().setHSL(.25 + (i % 5) * .008, .12, .72 + (i % 4) * .04) }));
    const understory = JUNGLE_LAYOUT.subCanopyTrees.map((t, i) => ({ x: t.x, z: t.z, width: t.scale * 1.16, height: t.height / 8.5, yaw: t.rotY, tint: new Color().setHSL(.23 + (i % 4) * .01, .15, .72 + (i % 5) * .035) }));
    const shrub = JUNGLE_LAYOUT.bushes.flatMap((t, i) => {
      const tint = new Color().setHSL(.23, .18, .72 + (i % 3) * .07);
      const items = [{ x: t.x, z: t.z, width: t.scale * 1.12, height: t.scale * .72, yaw: t.rotY, tint }];
      if (i % 2 === 0) items.push({ x: t.x + Math.sin(t.rotY) * 1.1, z: t.z + Math.cos(t.rotY) * 1.1, width: t.scale * .8, height: t.scale * .58, yaw: t.rotY + .8, tint: tint.clone().offsetHSL(.01, 0, -.03) });
      return items;
    });
    return { canopy, understory, shrub };
  }, []);
  useFrame((_, dt) => { wind.value += Math.min(dt, .05); });
  return <>
    <TreeLayer kind="canopy" items={placements.canopy} bark={materials.bark} foliage={materials.leaves[0]} />
    <TreeLayer kind="understory" items={placements.understory} bark={materials.bark} foliage={materials.leaves[1]} />
    <TreeLayer kind="shrub" items={placements.shrub} bark={materials.bark} foliage={materials.leaves[1]} />
    <ForestFloor />
  </>;
}

function ForestFloor() {
  const { scene } = useGLTF(`${ROOT}fern-rock.glb`);
  const parts = useMemo(() => {
    scene.updateMatrixWorld(true);
    const result: { geometry: BufferGeometry; material: Material | Material[] }[] = [];
    scene.traverse(object => {
      if (!(object instanceof Mesh)) return;
      const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld);
      const material = Array.isArray(object.material) ? object.material.map(m => m.clone()) : object.material.clone();
      for (const m of Array.isArray(material) ? material : [material]) m.side = DoubleSide;
      result.push({ geometry, material });
    });
    return result;
  }, [scene]);
  useEffect(() => () => parts.forEach(p => { p.geometry.dispose(); (Array.isArray(p.material) ? p.material : [p.material]).forEach(m => m.dispose()); }), [parts]);
  const items = useMemo(() => JUNGLE_LAYOUT.bushes.map((b, i) => ({ x: b.x + Math.sin(b.rotY) * .4, z: b.z + Math.cos(b.rotY) * .4, width: 1.1 + (i % 4) * .2, height: .9 + (i % 3) * .15, yaw: b.rotY, tint: new Color('#ffffff') })), []);
  return <>{parts.map((part, i) => <NearbyInstances key={i} {...part} items={items} radius={110} />)}</>;
}
