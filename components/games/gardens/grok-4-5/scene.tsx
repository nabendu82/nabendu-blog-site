"use client";

import { useMemo, useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import {
  CircleGeometry,
  Color,
  CylinderGeometry,
  DodecahedronGeometry,
  DoubleSide,
  Fog,
  IcosahedronGeometry,
  InstancedMesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
} from "three";
import {
  JUNGLE_LAYOUT,
  GARDEN_HALF,
  type TreeData,
  type SubCanopyTreeData,
  type BambooData,
  type BushData,
  type PondData,
} from "./maze";

export { GARDEN_HALF, JUNGLE_LAYOUT };

/* ---------- Shared geometry factories (called once via useMemo) ---------- */

function createGiantCanopyGeometry() {
  const geo = new IcosahedronGeometry(4.2, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);
    const n = Math.sin(vx * 2.5 + vy * 2.0) * 0.35;
    pos.setXYZ(i, vx * (1.15 + n * 0.2), vy * 0.85 + n * 0.35, vz * (1.15 + n * 0.2));
  }
  geo.computeVertexNormals();
  return geo;
}

function createSubCanopyGeometry() {
  const geo = new IcosahedronGeometry(2.5, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);
    const n = Math.sin(vx * 3.5 + vy * 3.0) * 0.22;
    pos.setXYZ(i, vx * (1 + n), vy * 1.05 + n * 0.25, vz * (1 + n));
  }
  geo.computeVertexNormals();
  return geo;
}

function createTrunkGeometry() {
  const geo = new CylinderGeometry(0.32, 0.65, 12, 8, 4);
  geo.translate(0, 6, 0);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const v = y / 12;
    if (v < 0.22) {
      const flute = Math.pow(1.0 - v / 0.22, 2) * 0.28;
      pos.setX(i, pos.getX(i) * (1 + flute));
      pos.setZ(i, pos.getZ(i) * (1 + flute));
    }
  }
  geo.computeVertexNormals();
  return geo;
}

function createBambooGeometry() {
  const geo = new CylinderGeometry(0.045, 0.065, 12, 6, 4);
  geo.translate(0, 6, 0);
  return geo;
}

/* ---------- Main Scene ---------- */

export function ZenGardenScene({ night = false }: { night?: boolean }) {
  const { scene } = useThree();
  const jungle = JUNGLE_LAYOUT;

  useEffect(() => {
    if (night) {
      scene.background = new Color("#050810");
      scene.fog = new Fog("#0a1018", 4, 28);
    } else {
      scene.background = new Color("#87ceeb");
      scene.fog = new Fog("#b0d4e8", 16, 85);
    }
  }, [scene, night]);

  return (
    <>
      {/* Bright Tropical Daytime Lighting — dims to night if the timer runs out */}
      <ambientLight intensity={night ? 0.12 : 1.2} color={night ? "#1a2233" : "#ffffff"} />
      <hemisphereLight args={night ? ["#1a2740", "#05080c", 0.25] : ["#87ceeb", "#3a2b1b", 0.9]} />
      <directionalLight
        castShadow={false}
        color={night ? "#4a5a80" : "#fff8e7"}
        intensity={night ? 0.15 : 3.0}
        position={[50, 80, 40]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={500}
        shadow-camera-left={-90}
        shadow-camera-right={90}
        shadow-camera-top={90}
        shadow-camera-bottom={-90}
        shadow-bias={-0.0004}
      />

      <ForestLoamGround />
      <DirtTrails
        escapePolyline={jungle.escapePolyline}
        pathPolylines={jungle.pathPolylines}
      />
      <JunglePond pond={jungle.pond} />
      <CanopyTrees trees={jungle.canopyTrees} />
      <SubCanopyTrees trees={jungle.subCanopyTrees} />
      <BambooStalks bamboos={jungle.bamboos} />
      <Bushes bushes={jungle.bushes} />
      <Lanterns lanterns={jungle.lanterns} />
      <StoneGateway position={jungle.stoneGatewayPos} />
    </>
  );
}

/* ---------- Ground ---------- */

function ForestLoamGround() {
  const geo = useMemo(() => {
    const g = new PlaneGeometry(GARDEN_HALF * 2 + 40, GARDEN_HALF * 2 + 40, 48, 48);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, Math.sin(x * 0.08) * Math.cos(z * 0.08) * 0.35);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial color="#3a2818" roughness={0.92} metalness={0} />
    </mesh>
  );
}

/* ---------- Pond ---------- */

function JunglePond({ pond }: { pond: PondData }) {
  const pondGeo = useMemo(() => {
    const g = new CircleGeometry(pond.radius, 40);
    g.rotateX(-Math.PI / 2);
    return g;
  }, [pond.radius]);

  const lilyGeo = useMemo(() => {
    const g = new CircleGeometry(0.55, 12);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  const lilyMat = useMemo(
    () => new MeshStandardMaterial({ color: "#2d7a36", roughness: 0.6, side: DoubleSide }),
    [],
  );

  const padRef = useRef<InstancedMesh>(null);

  useEffect(() => {
    const mesh = padRef.current;
    if (!mesh) return;
    const d = new Object3D();
    pond.lilyPads.forEach((lp, i) => {
      d.position.set(lp.x, 0.06, lp.z);
      d.scale.set(lp.scale, 1, lp.scale);
      d.rotation.set(0, lp.rotY, 0);
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
  }, [pond]);

  return (
    <group>
      <mesh geometry={pondGeo} position={[pond.centerX, 0.02, pond.centerZ]} receiveShadow>
        <meshStandardMaterial color="#1a7a6e" roughness={0.15} metalness={0.7} transparent opacity={0.9} />
      </mesh>
      <instancedMesh ref={padRef} args={[lilyGeo, lilyMat, pond.lilyPads.length]} frustumCulled={false} />
    </group>
  );
}

/* ---------- 750+ Giant Canopy Trees ---------- */

function CanopyTrees({ trees }: { trees: TreeData[] }) {
  const trunkGeo = useMemo(() => createTrunkGeometry(), []);
  const canopyGeo = useMemo(() => createGiantCanopyGeometry(), []);
  const trunkMat = useMemo(() => new MeshStandardMaterial({ roughness: 0.9 }), []);
  const canopyMat = useMemo(() => new MeshStandardMaterial({ roughness: 0.72 }), []);

  const trunkRef = useRef<InstancedMesh>(null);
  const canopyRef = useRef<InstancedMesh>(null);

  useEffect(() => {
    const t = trunkRef.current;
    const c = canopyRef.current;
    if (!t || !c) return;

    const d = new Object3D();
    for (let i = 0; i < trees.length; i++) {
      const tr = trees[i];

      // Trunk
      d.position.set(tr.x, 0, tr.z);
      d.scale.set(tr.scale, tr.height / 12, tr.scale);
      d.rotation.set(0, tr.rotY, 0);
      d.updateMatrix();
      t.setMatrixAt(i, d.matrix);
      t.setColorAt(i, new Color(tr.trunkColor));

      // Canopy crown
      d.position.set(tr.x, tr.height * 0.88, tr.z);
      d.scale.set(tr.scale * 1.5, tr.scale * 1.2, tr.scale * 1.5);
      d.rotation.set(0, tr.rotY * 1.3, 0); // slightly different rotation
      d.updateMatrix();
      c.setMatrixAt(i, d.matrix);
      c.setColorAt(i, new Color(tr.leafColor));
    }

    t.instanceMatrix.needsUpdate = true;
    if (t.instanceColor) t.instanceColor.needsUpdate = true;
    c.instanceMatrix.needsUpdate = true;
    if (c.instanceColor) c.instanceColor.needsUpdate = true;

    // Critical: disable frustum culling so instances are always drawn
    t.frustumCulled = false;
    c.frustumCulled = false;
  }, [trees]);

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[trunkGeo, trunkMat, trees.length]} receiveShadow frustumCulled={false} />
      <instancedMesh ref={canopyRef} args={[canopyGeo, canopyMat, trees.length]} frustumCulled={false} />
    </group>
  );
}

/* ---------- 850+ Sub-Canopy Trees ---------- */

function SubCanopyTrees({ trees }: { trees: SubCanopyTreeData[] }) {
  const trunkGeo = useMemo(() => {
    const g = new CylinderGeometry(0.18, 0.32, 8, 6);
    g.translate(0, 4, 0);
    return g;
  }, []);
  const foliageGeo = useMemo(() => createSubCanopyGeometry(), []);
  const trunkMat = useMemo(() => new MeshStandardMaterial({ color: "#2d1e13", roughness: 0.9 }), []);
  const foliageMat = useMemo(() => new MeshStandardMaterial({ roughness: 0.72 }), []);

  const trunkRef = useRef<InstancedMesh>(null);
  const foliageRef = useRef<InstancedMesh>(null);

  useEffect(() => {
    const t = trunkRef.current;
    const f = foliageRef.current;
    if (!t || !f) return;

    const d = new Object3D();
    for (let i = 0; i < trees.length; i++) {
      const tr = trees[i];

      d.position.set(tr.x, 0, tr.z);
      d.scale.set(tr.scale, tr.height / 8, tr.scale);
      d.rotation.set(0, tr.rotY, 0);
      d.updateMatrix();
      t.setMatrixAt(i, d.matrix);

      d.position.set(tr.x, tr.height * 0.85, tr.z);
      d.scale.set(tr.scale * 1.3, tr.scale * 1.1, tr.scale * 1.3);
      d.rotation.set(0, tr.rotY, 0);
      d.updateMatrix();
      f.setMatrixAt(i, d.matrix);
      f.setColorAt(i, new Color(tr.color));
    }

    t.instanceMatrix.needsUpdate = true;
    f.instanceMatrix.needsUpdate = true;
    if (f.instanceColor) f.instanceColor.needsUpdate = true;
    t.frustumCulled = false;
    f.frustumCulled = false;
  }, [trees]);

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[trunkGeo, trunkMat, trees.length]} receiveShadow frustumCulled={false} />
      <instancedMesh ref={foliageRef} args={[foliageGeo, foliageMat, trees.length]} frustumCulled={false} />
    </group>
  );
}

/* ---------- 1200+ Bamboo Stalks ---------- */

function BambooStalks({ bamboos }: { bamboos: BambooData[] }) {
  const geo = useMemo(() => createBambooGeometry(), []);
  const mat = useMemo(() => new MeshStandardMaterial({ roughness: 0.65 }), []);
  const ref = useRef<InstancedMesh>(null);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;

    const d = new Object3D();
    for (let i = 0; i < bamboos.length; i++) {
      const b = bamboos[i];
      d.position.set(b.x, 0, b.z);
      d.scale.set(b.scale, b.h / 12, b.scale);
      d.rotation.set(b.tiltX, b.rotY, b.tiltZ);
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
      mesh.setColorAt(i, new Color(b.color));
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
  }, [bamboos]);

  return (
    <instancedMesh ref={ref} args={[geo, mat, bamboos.length]} receiveShadow frustumCulled={false} />
  );
}

/* ---------- 1200+ Bushes ---------- */

function Bushes({ bushes }: { bushes: BushData[] }) {
  const geo = useMemo(() => new DodecahedronGeometry(1.6, 0), []);
  const mat = useMemo(() => new MeshStandardMaterial({ roughness: 0.75 }), []);
  const ref = useRef<InstancedMesh>(null);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;

    const d = new Object3D();
    for (let i = 0; i < bushes.length; i++) {
      const b = bushes[i];
      d.position.set(b.x, 0.45, b.z);
      d.scale.set(b.scale * 1.5, b.scale * 0.85, b.scale * 1.5);
      d.rotation.set(0, b.rotY, 0);
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
      mesh.setColorAt(i, new Color(b.color));
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
  }, [bushes]);

  return (
    <instancedMesh ref={ref} args={[geo, mat, bushes.length]} receiveShadow frustumCulled={false} />
  );
}

/* ---------- Lanterns ---------- */

function Lanterns({ lanterns }: { lanterns: [number, number, number][] }) {
  return (
    <group>
      {lanterns.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh castShadow position={[0, 0.25, 0]}>
            <boxGeometry args={[0.55, 0.5, 0.55]} />
            <meshStandardMaterial color="#3e3832" roughness={0.92} />
          </mesh>
          <mesh castShadow position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.16, 0.22, 0.5, 8]} />
            <meshStandardMaterial color="#322d26" roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <boxGeometry args={[0.3, 0.32, 0.3]} />
            <meshStandardMaterial color="#ffaa44" emissive="#ffaa44" emissiveIntensity={2.0} />
            <pointLight color="#ffaa44" intensity={1.5} distance={9} />
          </mesh>
          <mesh castShadow position={[0, 1.42, 0]}>
            <coneGeometry args={[0.45, 0.3, 4]} />
            <meshStandardMaterial color="#3e3832" roughness={0.92} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ---------- Stone Gateway ---------- */

function StoneGateway({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[-2.4, 2.4].map((px) => (
        <group key={px} position={[px, 0, 0]}>
          <mesh castShadow position={[0, 2.6, 0]}>
            <cylinderGeometry args={[0.32, 0.38, 5.2, 10]} />
            <meshStandardMaterial color="#4a4238" roughness={0.88} />
          </mesh>
          <mesh castShadow position={[0, 5.3, 0]}>
            <boxGeometry args={[0.9, 0.4, 0.9]} />
            <meshStandardMaterial color="#3e362e" roughness={0.9} />
          </mesh>
        </group>
      ))}

      <mesh castShadow position={[0, 5.55, 0]}>
        <boxGeometry args={[6.2, 0.5, 0.65]} />
        <meshStandardMaterial color="#423a30" roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0, 6.0, 0]}>
        <boxGeometry args={[5.2, 0.4, 0.55]} />
        <meshStandardMaterial color="#383028" roughness={0.88} />
      </mesh>

      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh position={[0, 1.8, 0]}>
          <ringGeometry args={[1.0, 1.35, 32]} />
          <meshBasicMaterial color="#64ffda" transparent opacity={0.8} side={DoubleSide} />
          <pointLight color="#64ffda" intensity={3.5} distance={14} />
        </mesh>
      </Float>
    </group>
  );
}

/* ---------- Dirt Trail System ----------
 * All paths (correct escape route + all dead-ends) rendered identically as
 * narrow 1.6m dark-earth footpaths. No golden colour, no orbs, no hints.
 * Player must explore to discover which path leads to the exit.
 * 2 InstancedMesh draw calls total.
 */

type SegData = { midX: number; midZ: number; len: number; angle: number };

function buildSegs(polys: { x: number; z: number }[][]): SegData[] {
  const segs: SegData[] = [];
  for (const poly of polys) {
    for (let i = 0; i < poly.length - 1; i++) {
      const a = poly[i];
      const b = poly[i + 1];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      segs.push({
        midX: (a.x + b.x) / 2,
        midZ: (a.z + b.z) / 2,
        len: Math.hypot(dx, dz),
        angle: Math.atan2(dx, dz),
      });
    }
  }
  return segs;
}

// Sample the same sine-wave terrain formula used in ForestLoamGround
function terrainY(x: number, z: number) {
  return Math.sin(x * 0.08) * Math.cos(z * 0.08) * 0.35;
}

function DirtTrails({
  escapePolyline,
  pathPolylines,
}: {
  escapePolyline: { x: number; z: number }[];
  pathPolylines: { x: number; z: number }[][];
}) {
  // Merge ALL polylines so every trail looks identical
  const allSegs = useMemo(
    () => buildSegs([escapePolyline, ...pathPolylines]),
    [escapePolyline, pathPolylines],
  );

  // Collect all unique junction points across all polys
  const junctions = useMemo(() => {
    const pts: { x: number; z: number }[] = [];
    for (const poly of [escapePolyline, ...pathPolylines]) {
      for (const pt of poly) {
        // Deduplicate within ~0.5m
        const dup = pts.some(
          (p) => Math.abs(p.x - pt.x) < 0.5 && Math.abs(p.z - pt.z) < 0.5,
        );
        if (!dup) pts.push(pt);
      }
    }
    return pts;
  }, [escapePolyline, pathPolylines]);

  // Shared geometry + material — dark worn-earth, no lighting math
  const quadGeo = useMemo(() => new PlaneGeometry(1, 1), []);
  const circleGeo = useMemo(() => new CircleGeometry(1, 14), []);

  // Single dirt material for both strips and junction pads
  const dirtMat = useMemo(
    () => new MeshBasicMaterial({ color: "#33200e" }),
    [],
  );

  const stripRef = useRef<InstancedMesh>(null);
  const juncRef = useRef<InstancedMesh>(null);

  useEffect(() => {
    const dummy = new Object3D();

    // Narrow footpath strips — 1.6m wide
    if (stripRef.current) {
      const m = stripRef.current;
      allSegs.forEach((seg, i) => {
        const ty = terrainY(seg.midX, seg.midZ);
        dummy.position.set(seg.midX, ty + 0.055, seg.midZ);
        dummy.rotation.set(-Math.PI / 2, 0, -seg.angle);
        dummy.scale.set(1.6, seg.len + 0.3, 1);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
      m.frustumCulled = false;
    }

    // Junction dirt pads (radius 1.0m) — patch corners so paths join cleanly
    if (juncRef.current) {
      const m = juncRef.current;
      junctions.forEach((pt, i) => {
        const ty = terrainY(pt.x, pt.z);
        dummy.position.set(pt.x, ty + 0.065, pt.z);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(1.0, 1.0, 1);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
      m.frustumCulled = false;
    }
  }, [allSegs, junctions]);

  return (
    <group>
      {/* Narrow dirt footpath strips — 1 draw call */}
      <instancedMesh ref={stripRef} args={[quadGeo, dirtMat, allSegs.length]} frustumCulled={false} />
      {/* Junction dirt pads — 1 draw call */}
      <instancedMesh ref={juncRef} args={[circleGeo, dirtMat, junctions.length]} frustumCulled={false} />
    </group>
  );
}
