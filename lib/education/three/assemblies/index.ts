import * as THREE from "three";
import type { ForceVectorSpec } from "@/lib/education/three/force-vectors";
import { disposeObject } from "@/lib/education/three/dispose";
import {
  clamp,
  gearTrain,
  inclinedPlaneForces,
  leverForces,
  pulleyEffort,
  pulleyIdealMA,
  screwForces,
  wheelAxleForces,
} from "@/lib/education/physics";

export type HudState = {
  ma: number;
  effort: number;
  load: number;
  lines: { label: string; value: string }[];
};

export type AssemblyParams = Record<string, number>;

export interface MachineAssembly {
  root: THREE.Group;
  grabTargets: THREE.Object3D[];
  homeCamera: { x: number; y: number; z: number };
  homeTarget: { x: number; y: number; z: number };
  setParams(params: AssemblyParams): void;
  getParams(): AssemblyParams;
  getForceVectors(): ForceVectorSpec[];
  getHud(): HudState;
  onDrag(target: THREE.Object3D, dx: number, dy: number): boolean;
  onPointerDown?(target: THREE.Object3D): void;
  /** Idle teaching motion while auto-rotate / demo is on. Returns true if scene changed. */
  tick?(dt: number, demo: boolean): boolean;
  reset(): void;
  setIsolated(isolated: boolean): void;
  dispose(): void;
}

function metal(color: number, roughness = 0.38, metalness = 0.55) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    envMapIntensity: 0.9,
  });
}

function matte(color: number) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.82,
    metalness: 0.08,
    envMapIntensity: 0.45,
  });
}

function paint(color: number) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.48,
    metalness: 0.18,
    envMapIntensity: 0.7,
  });
}

// ---------------------------------------------------------------------------
// Inclined plane — wedge ramp with clear height marker
// ---------------------------------------------------------------------------

export function createInclinedPlane(): MachineAssembly {
  const root = new THREE.Group();
  root.name = "inclined-plane";

  const params: AssemblyParams = { angle: 30, mu: 0.1, mass: 5, progress: 0.4 };
  let demoTime = 0;

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(4.6, 0.1, 2.4),
    new THREE.MeshPhysicalMaterial({
      color: 0xdce4ec,
      roughness: 0.12,
      metalness: 0.1,
      transmission: 0.3,
      transparent: true,
      opacity: 0.9,
    }),
  );
  floor.position.set(0, -1.15, 0);
  floor.receiveShadow = true;
  root.add(floor);

  const rampGroup = new THREE.Group();
  root.add(rampGroup);

  const rampLen = 3.2;
  const rampWidth = 1.15;
  const ramp = new THREE.Mesh(
    new THREE.BoxGeometry(rampLen, 0.1, rampWidth),
    new THREE.MeshPhysicalMaterial({
      color: 0x94a3b8,
      metalness: 0.8,
      roughness: 0.2,
      clearcoat: 0.3,
      clearcoatRoughness: 0.1,
    }),
  );
  ramp.name = "ramp";
  ramp.position.x = rampLen / 2;
  ramp.castShadow = true;
  ramp.receiveShadow = true;
  rampGroup.add(ramp);

  // Side rail for readability
  const rail = new THREE.Mesh(new THREE.BoxGeometry(rampLen, 0.08, 0.06), metal(0xc4922a, 0.45, 0.4));
  rail.position.set(rampLen / 2, 0.09, -rampWidth / 2 + 0.04);
  rail.castShadow = true;
  rampGroup.add(rail);

  const block = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.36, 0.42),
    new THREE.MeshStandardMaterial({
      color: 0x3f7a58,
      metalness: 0.1,
      roughness: 0.6,
    }),
  );
  block.name = "block";
  block.userData.grab = true;
  block.castShadow = true;
  block.receiveShadow = true;
  // Grab affordance ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.025, 8, 24),
    metal(0xf0c14a, 0.35, 0.5),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.22;
  block.add(ring);
  rampGroup.add(block);

  const heightBar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1, 0.06), metal(0xc4922a, 0.4, 0.35));
  heightBar.name = "height";
  root.add(heightBar);

  const heightCap = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), metal(0xc4922a));
  heightCap.name = "height";
  root.add(heightCap);

  const parts = [floor, ramp, block, heightBar, heightCap, rail];

  const layout = () => {
    const theta = (clamp(params.angle, 10, 55) * Math.PI) / 180;
    const H = Math.sin(theta) * rampLen;
    const baseX = -rampLen * 0.42;
    rampGroup.position.set(baseX, -1.1, 0);
    rampGroup.rotation.z = theta;

    const t = clamp(params.progress, 0.12, 0.82);
    block.position.set(0.35 + t * (rampLen - 0.7), 0.23, 0);

    heightBar.position.set(baseX + Math.cos(theta) * rampLen, -1.1 + H / 2, -0.75);
    heightBar.scale.y = Math.max(0.15, H);
    heightCap.position.set(heightBar.position.x, -1.1 + H, -0.75);
  };
  layout();

  return {
    root,
    grabTargets: [block],
    homeCamera: { x: 2.4, y: 1.8, z: 5.4 },
    homeTarget: { x: 0, y: -0.4, z: 0 },
    setParams(next) {
      Object.assign(params, next);
      layout();
    },
    getParams: () => ({ ...params }),
    getForceVectors() {
      const f = inclinedPlaneForces(params.mass, params.angle, params.mu);
      const theta = (params.angle * Math.PI) / 180;
      const along = new THREE.Vector3(Math.cos(theta), Math.sin(theta), 0);
      const perp = new THREE.Vector3(-Math.sin(theta), Math.cos(theta), 0);
      const origin = new THREE.Vector3();
      block.getWorldPosition(origin);
      origin.y += 0.12;
      return [
        {
          id: "weight",
          label: "Weight mg",
          origin: origin.clone(),
          direction: new THREE.Vector3(0, -1, 0),
          magnitude: f.weight,
          color: 0xb54a3c,
        },
        {
          id: "normal",
          label: "Normal N",
          origin: origin.clone(),
          direction: perp.clone(),
          magnitude: f.normal,
          color: 0x2a7ab0,
        },
        {
          id: "parallel",
          label: "mg sinθ",
          origin: origin.clone().add(new THREE.Vector3(0, 0, 0.12)),
          direction: along.clone().negate(),
          magnitude: f.parallel,
          color: 0xc4922a,
        },
        {
          id: "effort",
          label: "Effort",
          origin: origin.clone().add(new THREE.Vector3(0, 0, -0.12)),
          direction: along.clone(),
          magnitude: f.effort,
          color: 0x3d6b4f,
        },
      ];
    },
    getHud() {
      const f = inclinedPlaneForces(params.mass, params.angle, params.mu);
      return {
        ma: f.maIdeal,
        effort: f.effort,
        load: f.weight,
        lines: [
          { label: "Ideal MA (L/H)", value: f.maIdeal.toFixed(2) },
          { label: "Actual MA", value: f.maActual.toFixed(2) },
          { label: "Effort", value: `${f.effort.toFixed(1)} N` },
          { label: "Load (weight)", value: `${f.weight.toFixed(1)} N` },
          { label: "Normal N", value: `${f.normal.toFixed(1)} N` },
          { label: "Friction", value: `${f.friction.toFixed(1)} N` },
        ],
      };
    },
    onDrag(_target, dx, dy) {
      const theta = (params.angle * Math.PI) / 180;
      const along = dx * Math.cos(theta) + dy * Math.sin(theta);
      params.progress = clamp(params.progress + along * 0.7, 0.12, 0.82);
      layout();
      return true;
    },
    tick(dt, demo) {
      if (!demo) return false;
      demoTime += dt;
      params.progress = 0.35 + Math.sin(demoTime * 0.7) * 0.28;
      layout();
      return true;
    },
    reset() {
      params.angle = 30;
      params.mu = 0.1;
      params.mass = 5;
      params.progress = 0.4;
      demoTime = 0;
      layout();
    },
    setIsolated(isolated) {
      parts.forEach((p) => {
        p.visible = !isolated || p.name === "block" || p.name === "ramp";
      });
    },
    dispose() {
      disposeObject(root);
    },
  };
}

// ---------------------------------------------------------------------------
// Block & tackle
// ---------------------------------------------------------------------------

export function createPulley(): MachineAssembly {
  const root = new THREE.Group();
  root.name = "pulley";
  const params: AssemblyParams = { strands: 4, load: 200, efficiency: 0.9, lift: 0.4 };
  let demoTime = 0;

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.0, 16), metal(0x6a7582));
  post.position.set(0, 0.15, -0.55);
  root.add(post);

  const beam = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.12), metal(0x6a7582));
  beam.position.set(0, 1.55, -0.55);
  root.add(beam);

  const fixedPulley = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.06, 14, 28), metal(0xc4922a, 0.35, 0.6));
  fixedPulley.name = "fixed";
  fixedPulley.rotation.y = Math.PI / 2;
  fixedPulley.position.set(0, 1.4, 0);
  root.add(fixedPulley);

  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 10), metal(0x9aa3ad));
  axle.rotation.z = Math.PI / 2;
  axle.position.copy(fixedPulley.position);
  root.add(axle);

  const movable = new THREE.Group();
  movable.name = "movable";
  const movPulley = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.055, 14, 28), metal(0x2a7ab0, 0.35, 0.6));
  movPulley.rotation.y = Math.PI / 2;
  movable.add(movPulley);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 10, 16, Math.PI), metal(0x9aa3ad));
  hook.position.y = -0.38;
  hook.rotation.x = Math.PI;
  movable.add(hook);
  const loadBlock = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.38, 0.42), paint(0x3f7a58));
  loadBlock.name = "load";
  loadBlock.position.y = -0.72;
  movable.add(loadBlock);
  root.add(movable);

  const ropeMat = new THREE.MeshStandardMaterial({ color: 0xe2d2b0, roughness: 0.92, metalness: 0 });
  const ropes: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i += 1) {
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1, 6), ropeMat);
    rope.name = "strands";
    ropes.push(rope);
    root.add(rope);
  }

  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.11, 18, 18), paint(0xb54a3c));
  handle.name = "effort";
  handle.userData.grab = true;
  const handleRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.02, 8, 20),
    metal(0xf0c14a, 0.35, 0.5),
  );
  handle.add(handleRing);
  root.add(handle);

  const freeRope = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1, 6), ropeMat);
  root.add(freeRope);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.1, 0.12, 36), matte(0x5b6775));
  base.position.y = -1.4;
  root.add(base);

  const layout = () => {
    const n = pulleyIdealMA(params.strands);
    const lift = clamp(params.lift, 0.08, 0.82);
    const movY = 0.45 - lift * 1.05;
    movable.position.set(0, movY, 0);
    const topY = 1.4;
    const bottomY = movY;
    const span = Math.max(0.25, topY - bottomY);
    for (let i = 0; i < ropes.length; i += 1) {
      const rope = ropes[i];
      if (i < n) {
        rope.visible = true;
        const x = (i - (n - 1) / 2) * 0.1;
        rope.position.set(x, (topY + bottomY) / 2, 0);
        rope.scale.set(1, span, 1);
      } else {
        rope.visible = false;
      }
    }
    handle.position.set(0.7, topY - lift * 0.85, 0.28);
    const freeLen = Math.max(0.3, topY - handle.position.y);
    freeRope.position.set(0.35, topY - freeLen / 2, 0.14);
    freeRope.scale.set(1, freeLen, 1);
    freeRope.rotation.z = -0.35;
  };
  layout();

  return {
    root,
    grabTargets: [handle],
    homeCamera: { x: 1.8, y: 1.0, z: 5.2 },
    homeTarget: { x: 0, y: 0.15, z: 0 },
    setParams(next) {
      Object.assign(params, next);
      layout();
    },
    getParams: () => ({ ...params }),
    getForceVectors() {
      const n = pulleyIdealMA(params.strands);
      const effort = pulleyEffort(params.load, n, params.efficiency);
      const loadOrigin = new THREE.Vector3();
      loadBlock.getWorldPosition(loadOrigin);
      const handleOrigin = new THREE.Vector3();
      handle.getWorldPosition(handleOrigin);
      const movOrigin = new THREE.Vector3();
      movable.getWorldPosition(movOrigin);
      return [
        {
          id: "load",
          label: "Load",
          origin: loadOrigin,
          direction: new THREE.Vector3(0, -1, 0),
          magnitude: Math.min(params.load, 120),
          color: 0xb54a3c,
        },
        {
          id: "effort",
          label: "Effort",
          origin: handleOrigin,
          direction: new THREE.Vector3(0, -1, 0),
          magnitude: Math.min(effort * 2.2, 90),
          color: 0x3d6b4f,
        },
        {
          id: "support",
          label: "Strand tension",
          origin: movOrigin.clone().add(new THREE.Vector3(0.18, 0.15, 0)),
          direction: new THREE.Vector3(0, 1, 0),
          magnitude: Math.min(params.load / n, 80),
          color: 0x2a7ab0,
        },
      ];
    },
    getHud() {
      const n = pulleyIdealMA(params.strands);
      const effort = pulleyEffort(params.load, n, params.efficiency);
      return {
        ma: n,
        effort,
        load: params.load,
        lines: [
          { label: "Ideal MA (n)", value: String(n) },
          { label: "Effort", value: `${effort.toFixed(1)} N` },
          { label: "Load", value: `${params.load.toFixed(0)} N` },
          { label: "Efficiency", value: `${Math.round(params.efficiency * 100)}%` },
          { label: "Tension / strand", value: `${(params.load / n).toFixed(1)} N` },
        ],
      };
    },
    onDrag(_target, _dx, dy) {
      params.lift = clamp(params.lift - dy * 0.95, 0.08, 0.82);
      layout();
      return true;
    },
    tick(dt, demo) {
      if (!demo) return false;
      demoTime += dt;
      params.lift = 0.38 + Math.sin(demoTime * 0.65) * 0.26;
      layout();
      return true;
    },
    reset() {
      params.strands = 4;
      params.load = 200;
      params.efficiency = 0.9;
      params.lift = 0.4;
      demoTime = 0;
      layout();
    },
    setIsolated(isolated) {
      root.traverse((obj) => {
        if (!(obj as THREE.Mesh).isMesh) return;
        const name = obj.name;
        obj.visible =
          !isolated ||
          name === "movable" ||
          name === "effort" ||
          name === "load" ||
          name === "strands" ||
          name === "fixed";
      });
      movable.visible = true;
    },
    dispose() {
      disposeObject(root);
    },
  };
}

// ---------------------------------------------------------------------------
// Gear train
// ---------------------------------------------------------------------------

function createGearMesh(teeth: number, radius: number, color: number) {
  const shape = new THREE.Shape();
  const toothDepth = radius * 0.14;
  const inner = radius - toothDepth;
  for (let i = 0; i < teeth; i += 1) {
    const a0 = (i / teeth) * Math.PI * 2;
    const a1 = ((i + 0.32) / teeth) * Math.PI * 2;
    const a2 = ((i + 0.5) / teeth) * Math.PI * 2;
    const a3 = ((i + 0.82) / teeth) * Math.PI * 2;
    const a4 = ((i + 1) / teeth) * Math.PI * 2;
    const pts = [
      [Math.cos(a0) * inner, Math.sin(a0) * inner],
      [Math.cos(a1) * radius, Math.sin(a1) * radius],
      [Math.cos(a2) * radius, Math.sin(a2) * radius],
      [Math.cos(a3) * inner, Math.sin(a3) * inner],
      [Math.cos(a4) * inner, Math.sin(a4) * inner],
    ];
    if (i === 0) shape.moveTo(pts[0][0], pts[0][1]);
    for (const [x, y] of pts) shape.lineTo(x, y);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 1 });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0.1, 0);
  const mesh = new THREE.Mesh(geo, metal(color, 0.32, 0.62));
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.2, radius * 0.2, 0.26, 20),
    metal(0x2a3038, 0.4, 0.7),
  );
  hub.position.y = 0.1;
  const group = new THREE.Group();
  group.add(mesh, hub);
  return group;
}

export function createGears(): MachineAssembly {
  const root = new THREE.Group();
  root.name = "gears";
  const params: AssemblyParams = { driverTeeth: 16, drivenTeeth: 32, angle: 0 };
  let demoTime = 0;

  const plate = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.1, 2.2), matte(0x5b6775));
  plate.position.y = -0.95;
  root.add(plate);

  let driver: THREE.Group = new THREE.Group();
  const drivenHolder = new THREE.Group();
  drivenHolder.name = "driven";
  let driven: THREE.Group = new THREE.Group();
  const grabTargets: THREE.Object3D[] = [];

  const axleL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.55, 12), metal(0x9aa3ad));
  const axleR = axleL.clone();
  root.add(drivenHolder, axleL, axleR);

  const applyAngles = () => {
    const g = gearTrain(params.driverTeeth, params.drivenTeeth, params.angle);
    driver.rotation.y = g.driverAngle;
    drivenHolder.rotation.y = g.drivenAngle;
  };

  const rebuild = () => {
    if (driver.parent) root.remove(driver);
    drivenHolder.clear();
    disposeObject(driver);
    disposeObject(driven);

    const nd = Math.round(params.driverTeeth);
    const nn = Math.round(params.drivenTeeth);
    const rDriver = 0.042 * nd;
    const rDriven = 0.042 * nn;
    driver = createGearMesh(nd, rDriver, 0xc4922a);
    driver.name = "driver";
    driver.userData.grab = true;
    const grabRing = new THREE.Mesh(
      new THREE.TorusGeometry(rDriver * 0.55, 0.03, 8, 24),
      metal(0xf0c14a, 0.35, 0.5),
    );
    grabRing.rotation.x = Math.PI / 2;
    grabRing.position.y = 0.28;
    driver.add(grabRing);

    driven = createGearMesh(nn, rDriven, 0x2a7ab0);
    driven.name = "driven";
    drivenHolder.add(driven);

    const gap = rDriver + rDriven - 0.05;
    driver.position.set(-gap * 0.45, -0.7, 0);
    drivenHolder.position.set(gap * 0.55, -0.7, 0);
    axleL.position.set(driver.position.x, -0.55, 0);
    axleR.position.set(drivenHolder.position.x, -0.55, 0);
    root.add(driver);
    grabTargets.length = 0;
    grabTargets.push(driver);
    applyAngles();
  };

  rebuild();

  return {
    root,
    grabTargets,
    homeCamera: { x: 0.2, y: 2.6, z: 4.8 },
    homeTarget: { x: 0.05, y: -0.45, z: 0 },
    setParams(next) {
      const teethChanged =
        (next.driverTeeth !== undefined && next.driverTeeth !== params.driverTeeth) ||
        (next.drivenTeeth !== undefined && next.drivenTeeth !== params.drivenTeeth);
      Object.assign(params, next);
      if (teethChanged) rebuild();
      else applyAngles();
    },
    getParams: () => ({ ...params }),
    getForceVectors() {
      const g = gearTrain(params.driverTeeth, params.drivenTeeth, params.angle);
      const dOrigin = new THREE.Vector3();
      driver.getWorldPosition(dOrigin);
      dOrigin.y += 0.35;
      const nOrigin = new THREE.Vector3();
      drivenHolder.getWorldPosition(nOrigin);
      nOrigin.y += 0.35;
      const meshOrigin = dOrigin.clone().lerp(nOrigin, 0.5);
      return [
        {
          id: "input-torque",
          label: "Input torque",
          origin: dOrigin,
          direction: new THREE.Vector3(0, 0, 1),
          magnitude: 35,
          color: 0xc4922a,
        },
        {
          id: "output-torque",
          label: "Output torque",
          origin: nOrigin,
          direction: new THREE.Vector3(0, 0, -1),
          magnitude: 35 * Math.min(g.torqueFactor, 2.5),
          color: 0x2a7ab0,
        },
        {
          id: "mesh",
          label: "Mesh force",
          origin: meshOrigin,
          direction: new THREE.Vector3(0, 1, 0),
          magnitude: 28,
          color: 0x3d6b4f,
        },
      ];
    },
    getHud() {
      const g = gearTrain(params.driverTeeth, params.drivenTeeth, params.angle);
      return {
        ma: g.ma,
        effort: 1,
        load: g.ma,
        lines: [
          { label: "Gear ratio", value: g.ratio.toFixed(2) },
          { label: "Ideal MA", value: g.ma.toFixed(2) },
          { label: "Speed factor", value: g.speedFactor.toFixed(2) },
          { label: "Torque factor", value: g.torqueFactor.toFixed(2) },
          { label: "Driver teeth", value: String(Math.round(params.driverTeeth)) },
          { label: "Driven teeth", value: String(Math.round(params.drivenTeeth)) },
        ],
      };
    },
    onDrag(_target, dx) {
      params.angle += dx * 3.5;
      applyAngles();
      return true;
    },
    tick(dt, demo) {
      if (!demo) return false;
      demoTime += dt;
      params.angle += dt * 0.85;
      applyAngles();
      return true;
    },
    reset() {
      params.driverTeeth = 16;
      params.drivenTeeth = 32;
      params.angle = 0;
      demoTime = 0;
      rebuild();
    },
    setIsolated(isolated) {
      plate.visible = !isolated;
      axleL.visible = !isolated;
      axleR.visible = !isolated;
    },
    dispose() {
      disposeObject(root);
    },
  };
}

// ---------------------------------------------------------------------------
// Lever (Class I)
// ---------------------------------------------------------------------------

export function createLever(): MachineAssembly {
  const root = new THREE.Group();
  root.name = "lever";
  const params: AssemblyParams = { effortArm: 1.6, loadArm: 0.8, load: 200, tilt: 0 };
  let demoTime = 0;

  const base = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.1, 1.6), matte(0x5b6775));
  base.position.y = -1.2;
  root.add(base);

  const fulcrum = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.55, 4), metal(0xc4922a, 0.4, 0.45));
  fulcrum.name = "fulcrum";
  fulcrum.position.set(0, -0.85, 0);
  root.add(fulcrum);

  const bar = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.12, 0.28), paint(0x8fa0b0));
  bar.name = "arms";
  bar.position.y = -0.55;
  root.add(bar);

  const loadBlock = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.4), paint(0x3f7a58));
  loadBlock.name = "load";
  root.add(loadBlock);

  const effortHandle = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), paint(0xb54a3c));
  effortHandle.name = "effort";
  effortHandle.userData.grab = true;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 8, 20), metal(0xf0c14a, 0.35, 0.5));
  effortHandle.add(ring);
  root.add(effortHandle);

  const layout = () => {
    const ea = clamp(params.effortArm, 0.8, 2.4);
    const la = clamp(params.loadArm, 0.4, 1.6);
    const total = ea + la;
    const scale = 3.4 / total;
    const tilt = clamp(params.tilt, -0.22, 0.22);
    bar.scale.set((total * scale) / 3.6, 1, 1);
    bar.rotation.z = tilt;
    bar.position.set((ea - la) * scale * 0.05, -0.55, 0);

    const loadX = -la * scale;
    const effortX = ea * scale;
    loadBlock.position.set(loadX * Math.cos(tilt), -0.55 + Math.sin(tilt) * loadX + 0.28, 0);
    effortHandle.position.set(effortX * Math.cos(tilt), -0.55 + Math.sin(tilt) * effortX, 0);
  };
  layout();

  return {
    root,
    grabTargets: [effortHandle],
    homeCamera: { x: 0.2, y: 1.8, z: 5.2 },
    homeTarget: { x: 0, y: -0.5, z: 0 },
    setParams(next) {
      Object.assign(params, next);
      layout();
    },
    getParams: () => ({ ...params }),
    getForceVectors() {
      const f = leverForces(params.load, params.effortArm, params.loadArm);
      const loadO = new THREE.Vector3();
      loadBlock.getWorldPosition(loadO);
      const effortO = new THREE.Vector3();
      effortHandle.getWorldPosition(effortO);
      const fulcrumO = new THREE.Vector3();
      fulcrum.getWorldPosition(fulcrumO);
      fulcrumO.y += 0.2;
      return [
        {
          id: "load",
          label: "Load",
          origin: loadO,
          direction: new THREE.Vector3(0, -1, 0),
          magnitude: Math.min(f.load * 0.35, 90),
          color: 0x3d6b4f,
        },
        {
          id: "effort",
          label: "Effort",
          origin: effortO,
          direction: new THREE.Vector3(0, -1, 0),
          magnitude: Math.min(f.effort * 0.9, 80),
          color: 0xb54a3c,
        },
        {
          id: "fulcrum",
          label: "Reaction",
          origin: fulcrumO,
          direction: new THREE.Vector3(0, 1, 0),
          magnitude: Math.min((f.load + f.effort) * 0.25, 70),
          color: 0xc4922a,
        },
      ];
    },
    getHud() {
      const f = leverForces(params.load, params.effortArm, params.loadArm);
      return {
        ma: f.maIdeal,
        effort: f.effort,
        load: f.load,
        lines: [
          { label: "Ideal MA", value: f.maIdeal.toFixed(2) },
          { label: "Effort", value: `${f.effort.toFixed(1)} N` },
          { label: "Load", value: `${f.load.toFixed(0)} N` },
          { label: "Effort arm", value: `${f.effortArm.toFixed(1)} m` },
          { label: "Load arm", value: `${f.loadArm.toFixed(1)} m` },
        ],
      };
    },
    onDrag(_target, _dx, dy) {
      params.tilt = clamp(params.tilt + dy * 0.8, -0.22, 0.22);
      layout();
      return true;
    },
    tick(dt, demo) {
      if (!demo) return false;
      demoTime += dt;
      params.tilt = Math.sin(demoTime * 0.7) * 0.16;
      layout();
      return true;
    },
    reset() {
      params.effortArm = 1.6;
      params.loadArm = 0.8;
      params.load = 200;
      params.tilt = 0;
      demoTime = 0;
      layout();
    },
    setIsolated(isolated) {
      base.visible = !isolated;
    },
    dispose() {
      disposeObject(root);
    },
  };
}

// ---------------------------------------------------------------------------
// Wheel & axle
// ---------------------------------------------------------------------------

export function createWheelAxle(): MachineAssembly {
  const root = new THREE.Group();
  root.name = "wheel-axle";
  const params: AssemblyParams = { wheelR: 1.2, axleR: 0.3, load: 200, angle: 0 };
  let demoTime = 0;

  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.2, 0.18), metal(0x6a7582));
  stand.position.set(0, -0.2, -0.55);
  root.add(stand);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.0, 0.12, 32), matte(0x5b6775));
  foot.position.y = -1.35;
  root.add(foot);

  const wheelGroup = new THREE.Group();
  wheelGroup.position.set(0, 0.15, 0);
  root.add(wheelGroup);

  let wheel: THREE.Mesh;
  let axle: THREE.Mesh;
  let handle: THREE.Mesh;
  let rope: THREE.Mesh | null = null;
  let loadBlock: THREE.Mesh | null = null;
  const grabTargets: THREE.Object3D[] = [];

  const rebuild = () => {
    while (wheelGroup.children.length) {
      const child = wheelGroup.children[0];
      wheelGroup.remove(child);
      disposeObject(child);
    }
    if (rope) {
      root.remove(rope);
      disposeObject(rope);
      rope = null;
    }
    if (loadBlock) {
      root.remove(loadBlock);
      disposeObject(loadBlock);
      loadBlock = null;
    }

    const R = clamp(params.wheelR, 0.8, 1.6) * 0.7;
    const r = clamp(params.axleR, 0.2, 0.6) * 0.7;

    wheel = new THREE.Mesh(new THREE.TorusGeometry(R, 0.07, 12, 36), metal(0xc4922a, 0.35, 0.55));
    wheel.name = "wheel";
    wheel.rotation.y = Math.PI / 2;
    wheelGroup.add(wheel);

    const spokeMat = metal(0x9aa3ad, 0.4, 0.5);
    for (let i = 0; i < 6; i += 1) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(R * 1.7, 0.05, 0.05), spokeMat);
      spoke.rotation.z = (i * Math.PI) / 6;
      wheelGroup.add(spoke);
    }

    axle = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.55, 20), metal(0x2a7ab0, 0.35, 0.6));
    axle.name = "axle";
    axle.rotation.z = Math.PI / 2;
    wheelGroup.add(axle);

    handle = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 14), paint(0xb54a3c));
    handle.name = "handle";
    handle.userData.grab = true;
    handle.position.set(0, R, 0.15);
    const hRing = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.02, 8, 18), metal(0xf0c14a));
    handle.add(hRing);
    wheelGroup.add(handle);

    rope = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 6), matte(0xe2d2b0));
    rope.name = "rope";
    root.add(rope);

    loadBlock = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.4), paint(0x3f7a58));
    loadBlock.name = "load";
    root.add(loadBlock);

    grabTargets.length = 0;
    grabTargets.push(handle);
    applyAngle();
  };

  const applyAngle = () => {
    wheelGroup.rotation.z = params.angle;
    const lift = ((params.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const drop = 0.2 + (lift / (Math.PI * 2)) * 1.1;
    if (rope && loadBlock) {
      rope.position.set(0.35, 0.15 - drop / 2, 0.35);
      rope.scale.set(1, Math.max(0.25, drop), 1);
      loadBlock.position.set(0.35, 0.15 - drop - 0.25, 0.35);
    }
  };

  rebuild();

  return {
    root,
    grabTargets,
    homeCamera: { x: 2.2, y: 1.4, z: 5.0 },
    homeTarget: { x: 0, y: -0.2, z: 0 },
    setParams(next) {
      const sizeChanged =
        (next.wheelR !== undefined && next.wheelR !== params.wheelR) ||
        (next.axleR !== undefined && next.axleR !== params.axleR);
      Object.assign(params, next);
      if (sizeChanged) rebuild();
      else applyAngle();
    },
    getParams: () => ({ ...params }),
    getForceVectors() {
      const f = wheelAxleForces(params.load, params.wheelR, params.axleR);
      const handleO = new THREE.Vector3();
      handle.getWorldPosition(handleO);
      const loadO = new THREE.Vector3();
      loadBlock?.getWorldPosition(loadO);
      const axleO = new THREE.Vector3();
      axle.getWorldPosition(axleO);
      return [
        {
          id: "effort",
          label: "Effort",
          origin: handleO,
          direction: new THREE.Vector3(0, 0, 1),
          magnitude: Math.min(f.effort * 1.2, 70),
          color: 0xb54a3c,
        },
        {
          id: "load",
          label: "Load",
          origin: loadO,
          direction: new THREE.Vector3(0, -1, 0),
          magnitude: Math.min(f.load * 0.3, 90),
          color: 0x3d6b4f,
        },
        {
          id: "axle-torque",
          label: "Axle force",
          origin: axleO.clone().add(new THREE.Vector3(0.2, 0, 0)),
          direction: new THREE.Vector3(0, -1, 0),
          magnitude: Math.min(f.load * 0.25, 70),
          color: 0x2a7ab0,
        },
      ];
    },
    getHud() {
      const f = wheelAxleForces(params.load, params.wheelR, params.axleR);
      return {
        ma: f.maIdeal,
        effort: f.effort,
        load: f.load,
        lines: [
          { label: "Ideal MA (R/r)", value: f.maIdeal.toFixed(2) },
          { label: "Effort", value: `${f.effort.toFixed(1)} N` },
          { label: "Load", value: `${f.load.toFixed(0)} N` },
          { label: "Wheel R", value: `${f.wheelR.toFixed(2)} m` },
          { label: "Axle r", value: `${f.axleR.toFixed(2)} m` },
        ],
      };
    },
    onDrag(_target, dx) {
      params.angle += dx * 3.2;
      applyAngle();
      return true;
    },
    tick(dt, demo) {
      if (!demo) return false;
      demoTime += dt;
      params.angle += dt * 0.7;
      applyAngle();
      return true;
    },
    reset() {
      params.wheelR = 1.2;
      params.axleR = 0.3;
      params.load = 200;
      params.angle = 0;
      demoTime = 0;
      rebuild();
    },
    setIsolated(isolated) {
      stand.visible = !isolated;
      foot.visible = !isolated;
    },
    dispose() {
      disposeObject(root);
    },
  };
}

// ---------------------------------------------------------------------------
// Screw jack
// ---------------------------------------------------------------------------

export function createScrew(): MachineAssembly {
  const root = new THREE.Group();
  root.name = "screw";
  const params: AssemblyParams = { handleR: 0.8, pitch: 0.1, load: 400, turns: 0 };
  let demoTime = 0;

  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.18, 36), matte(0x5b6775));
  base.position.y = -1.35;
  root.add(base);

  const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.5, 24), metal(0x6a7582, 0.4, 0.5));
  nut.position.y = -0.95;
  root.add(nut);

  const screwGroup = new THREE.Group();
  root.add(screwGroup);

  const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 3.2, 24), metal(0x2a7ab0, 0.35, 0.55));
  screw.name = "thread";
  screw.position.y = -0.6; // Shift center down so bottom stays inside nut at max rise
  screwGroup.add(screw);

  // Helix hint rings (extended to cover the longer shaft)
  for (let i = 0; i < 12; i += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.02, 6, 20),
      metal(0xc4922a, 0.45, 0.4),
    );
    ring.name = "pitch";
    ring.position.y = -1.4 + i * 0.22;
    ring.rotation.x = Math.PI / 2;
    screwGroup.add(ring);
  }

  const platform = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 24), paint(0x3f7a58));
  platform.name = "load";
  platform.position.y = 1.05;
  screwGroup.add(platform);

  const handleArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 10), metal(0x9aa3ad));
  handleArm.name = "handle";
  handleArm.rotation.z = Math.PI / 2;
  handleArm.position.y = 1.05;
  screwGroup.add(handleArm);

  const handleKnob = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 14), paint(0xb54a3c));
  handleKnob.name = "handle";
  handleKnob.userData.grab = true;
  const hRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.02, 8, 18), metal(0xf0c14a));
  handleKnob.add(hRing);
  screwGroup.add(handleKnob);

  const layout = () => {
    const R = clamp(params.handleR, 0.4, 1.2) * 0.7;
    const pitch = clamp(params.pitch, 0.05, 0.25);
    const turns = params.turns;
    screwGroup.rotation.y = turns * Math.PI * 2;
    const rise = clamp(turns * pitch * 2.2, -0.35, 0.85);
    screwGroup.position.y = rise;
    handleArm.scale.set(1, R * 2, 1);
    handleKnob.position.set(R, 1.05, 0);
  };
  layout();

  return {
    root,
    grabTargets: [handleKnob],
    homeCamera: { x: 1.8, y: 1.5, z: 5.0 },
    homeTarget: { x: 0, y: -0.2, z: 0 },
    setParams(next) {
      Object.assign(params, next);
      layout();
    },
    getParams: () => ({ ...params }),
    getForceVectors() {
      const f = screwForces(params.load, params.handleR, params.pitch);
      const handleO = new THREE.Vector3();
      handleKnob.getWorldPosition(handleO);
      const loadO = new THREE.Vector3();
      platform.getWorldPosition(loadO);
      return [
        {
          id: "effort",
          label: "Effort",
          origin: handleO,
          direction: new THREE.Vector3(0, 0, 1),
          magnitude: Math.min(f.effort * 2.5, 65),
          color: 0xb54a3c,
        },
        {
          id: "load",
          label: "Load",
          origin: loadO,
          direction: new THREE.Vector3(0, -1, 0),
          magnitude: Math.min(f.load * 0.18, 90),
          color: 0x3d6b4f,
        },
        {
          id: "advance",
          label: "Advance",
          origin: loadO.clone().add(new THREE.Vector3(0.35, 0, 0)),
          direction: new THREE.Vector3(0, 1, 0),
          magnitude: 40,
          color: 0xc4922a,
        },
      ];
    },
    getHud() {
      const f = screwForces(params.load, params.handleR, params.pitch);
      return {
        ma: f.maIdeal,
        effort: f.effort,
        load: f.load,
        lines: [
          { label: "Ideal MA", value: f.maIdeal.toFixed(2) },
          { label: "Effort", value: `${f.effort.toFixed(1)} N` },
          { label: "Load", value: `${f.load.toFixed(0)} N` },
          { label: "Pitch", value: `${f.pitch.toFixed(2)} m` },
          { label: "2πR path", value: `${f.circumference.toFixed(2)} m` },
        ],
      };
    },
    onDrag(_target, dx) {
      params.turns += dx * 1.4;
      layout();
      return true;
    },
    tick(dt, demo) {
      if (!demo) return false;
      demoTime += dt;
      params.turns += dt * 0.25;
      layout();
      return true;
    },
    reset() {
      params.handleR = 0.8;
      params.pitch = 0.1;
      params.load = 400;
      params.turns = 0;
      demoTime = 0;
      layout();
    },
    setIsolated(isolated) {
      base.visible = !isolated;
      nut.visible = !isolated;
    },
    dispose() {
      disposeObject(root);
    },
  };
}

export function createAssembly(id: string): MachineAssembly {
  switch (id) {
    case "pulley":
      return createPulley();
    case "gears":
      return createGears();
    case "lever":
      return createLever();
    case "wheel-axle":
      return createWheelAxle();
    case "screw":
      return createScrew();
    case "inclined-plane":
    default:
      return createInclinedPlane();
  }
}
