"use client";

import { memo, useMemo, useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { ForestVegetation } from './ForestVegetation';
import {
  CircleGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  Fog,
  InstancedMesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
} from "three";
import {
  JUNGLE_LAYOUT,
  GARDEN_HALF,
  type BambooData,
  type PondData,
} from "./maze";

export { GARDEN_HALF, JUNGLE_LAYOUT };

/* ---------- Shared geometry factories (called once via useMemo) ---------- */

function createBambooGeometry() {
  const geo = new CylinderGeometry(0.045, 0.065, 12, 6, 4);
  geo.translate(0, 6, 0);
  return geo;
}

/* ---------- Main Scene ---------- */

export const ZenGardenScene = memo(function ZenGardenScene({ night = false }: { night?: boolean }) {
  const { scene } = useThree();
  const jungle = JUNGLE_LAYOUT;

  useEffect(() => {
    if (night) {
      scene.background = new Color("#050810");
      scene.fog = new Fog("#0a1018", 4, 28);
    } else {
      scene.background = new Color("#a3b5a1");
      scene.fog = new Fog("#a3b5a1", 26, 100);
    }
  }, [scene, night]);

  return (
    <>
      {/* Bright Tropical Daytime Lighting — dims to night if the timer runs out */}
      <ambientLight intensity={night ? 0.12 : .45} color={night ? "#1a2233" : "#e3edcd"} />
      <hemisphereLight args={night ? ["#1a2740", "#05080c", 0.25] : ["#d2e2d5", "#343522", 1.1]} />
      <directionalLight
        castShadow={false}
        color={night ? "#4a5a80" : "#fff8e7"}
        intensity={night ? 0.15 : 2.0}
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
      <ForestVegetation />
      <BambooStalks bamboos={jungle.bamboos} />
      <Lanterns lanterns={jungle.lanterns} />
      <StoneGateway position={jungle.stoneGatewayPos} />
    </>
  );
});

/* ---------- Ground ---------- */

function ForestLoamGround() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#454535'; ctx.fillRect(0, 0, 512, 512);
    let seed = 9187;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < 12000; i++) {
      ctx.fillStyle = ['#3b3b2b', '#55543a', '#666044', '#30382a', '#74704c'][i % 5];
      ctx.globalAlpha = .2 + random() * .4;
      const size = 1 + random() * 4;
      ctx.fillRect(random() * 512, random() * 512, size, size);
    }
    for (let i = 0; i < 280; i++) {
      ctx.save(); ctx.translate(random() * 512, random() * 512); ctx.rotate(random() * Math.PI);
      ctx.fillStyle = ['#95835c', '#716943', '#464c2d'][i % 3]; ctx.globalAlpha = .55;
      ctx.beginPath(); ctx.ellipse(0, 0, 2 + random() * 2, 5 + random() * 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    const map = new CanvasTexture(canvas); map.colorSpace = SRGBColorSpace;
    map.wrapS = map.wrapT = RepeatWrapping; map.repeat.set(160, 160); map.anisotropy = 4;
    return map;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
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
      <meshStandardMaterial map={texture} roughness={0.98} metalness={0} />
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
