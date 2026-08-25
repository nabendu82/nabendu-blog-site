import * as THREE from "three";
import type { ForceVectorSpec } from "@/lib/education/three/force-vectors";
import { disposeObject } from "@/lib/education/three/dispose";
import {
  atwoodForces,
  clamp,
  hydraulicForces,
  leverForces,
  wedgeForces,
} from "@/lib/education/physics";
import type { AssemblyParams, MachineAssembly } from "@/lib/education/three/assemblies/types";
import {
  bench,
  brass,
  crate,
  glassReservoir,
  glassTube,
  grabKnob,
  hemp,
  iron,
  oilFill,
  paint,
  roti,
  rubber,
  shadow,
  sheave,
  stainless,
  cartWheel,
  wood,
} from "@/lib/education/three/workshop";

function ropeSeg(len: number) {
  const mesh = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, len, 6), hemp()));
  return mesh;
}

// ---------------------------------------------------------------------------
// Wedge — axe splitting a log (6th simple machine)
// ---------------------------------------------------------------------------

export function createWedge(): MachineAssembly {
  const root = new THREE.Group();
  root.name = "wedge";
  const params: AssemblyParams = { length: 0.8, thickness: 0.22, load: 300, drive: 0.35 };
  let demoTime = 0;

  root.add(bench(3.6, 1.8));

  const log = new THREE.Group();
  const trunk = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 1.7, 18), wood(0x8a5a32)));
  trunk.rotation.z = Math.PI / 2;
  trunk.position.set(0.15, -0.72, 0);
  log.add(trunk);
  const rings = wood(0xc4a06a);
  for (const x of [-0.78, 0.95]) {
    const end = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.06, 18), rings));
    end.rotation.z = Math.PI / 2;
    end.position.set(x, -0.72, 0);
    log.add(end);
  }
  root.add(log);

  const rightCrack = new THREE.Group();
  const rightBark = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.7), wood(0x6a4024)));
  rightBark.position.set(0.55, -0.55, 0);
  rightCrack.add(rightBark);
  root.add(rightCrack);

  const bladeGroup = new THREE.Group();
  bladeGroup.name = "blade";
  const blade = shadow(new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 4), iron(0x8a929c)));
  blade.name = "wedge";
  blade.rotation.z = Math.PI;
  blade.rotation.y = Math.PI / 4;
  const handle = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.85, 10), wood(0x6b3f1f)));
  handle.position.y = 0.7;
  const knob = grabKnob();
  knob.name = "effort";
  knob.position.y = 1.12;
  bladeGroup.add(blade, handle, knob);
  root.add(bladeGroup);

  const anvil = shadow(new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.16, 0.7), iron(0x4a5560)));
  anvil.position.set(0.1, -1.05, 0);
  root.add(anvil);

  const layout = () => {
    const drive = clamp(params.drive, 0.08, 0.85);
    const thick = clamp(params.thickness, 0.1, 0.4);
    blade.scale.set(thick / 0.22, clamp(params.length, 0.5, 1.2) / 0.8, thick / 0.22);
    bladeGroup.position.set(0.12, -0.15 + drive * 0.55, 0);
    rightCrack.rotation.z = -drive * 0.28;
    rightCrack.position.x = drive * 0.12;
  };
  layout();

  return {
    root,
    grabTargets: [knob],
    homeCamera: { x: 1.6, y: 1.4, z: 4.6 },
    homeTarget: { x: 0.1, y: -0.4, z: 0 },
    setParams(next) {
      Object.assign(params, next);
      layout();
    },
    getParams: () => ({ ...params }),
    getForceVectors() {
      const f = wedgeForces(params.load, params.length, params.thickness);
      const bladeO = new THREE.Vector3();
      blade.getWorldPosition(bladeO);
      const loadO = new THREE.Vector3();
      trunk.getWorldPosition(loadO);
      return [
        {
          id: "effort",
          label: "Effort",
          origin: bladeO.clone().add(new THREE.Vector3(0, 0.55, 0)),
          direction: new THREE.Vector3(0, -1, 0),
          magnitude: Math.min(f.effort * 0.8, 70),
          color: 0xb54a3c,
        },
        {
          id: "split",
          label: "Split force",
          origin: loadO.clone().add(new THREE.Vector3(0.35, 0.1, 0)),
          direction: new THREE.Vector3(1, 0, 0),
          magnitude: Math.min(f.load * 0.22, 80),
          color: 0x3d6b4f,
        },
        {
          id: "load",
          label: "Resistance",
          origin: loadO,
          direction: new THREE.Vector3(0, 1, 0),
          magnitude: 40,
          color: 0xc4922a,
        },
      ] satisfies ForceVectorSpec[];
    },
    getHud() {
      const f = wedgeForces(params.load, params.length, params.thickness);
      return {
        ma: f.maIdeal,
        effort: f.effort,
        load: f.load,
        lines: [
          { label: "Ideal MA (L/T)", value: f.maIdeal.toFixed(2) },
          { label: "Effort", value: `${f.effort.toFixed(1)} N` },
          { label: "Resistance", value: `${f.load.toFixed(0)} N` },
          { label: "Slope length", value: `${f.length.toFixed(2)} m` },
          { label: "Thickness", value: `${f.thickness.toFixed(2)} m` },
        ],
      };
    },
    onDrag(_target, _dx, dy) {
      params.drive = clamp(params.drive + dy * 0.9, 0.08, 0.85);
      layout();
      return true;
    },
    tick(dt, demo) {
      if (!demo) return false;
      demoTime += dt;
      params.drive = 0.38 + Math.sin(demoTime * 0.7) * 0.28;
      layout();
      return true;
    },
    reset() {
      params.length = 0.8;
      params.thickness = 0.22;
      params.load = 300;
      params.drive = 0.35;
      demoTime = 0;
      layout();
    },
    setIsolated(isolated) {
      anvil.visible = !isolated;
    },
    dispose() {
      disposeObject(root);
    },
  };
}

// ---------------------------------------------------------------------------
// Wheelbarrow — Class II lever
// ---------------------------------------------------------------------------

export function createWheelbarrow(): MachineAssembly {
  const root = new THREE.Group();
  root.name = "wheelbarrow";
  const params: AssemblyParams = { effortArm: 1.4, loadArm: 0.55, load: 250, tilt: 0.12 };
  let demoTime = 0;

  const floor = bench(4.4, 2.2);
  root.add(floor);

  const rig = new THREE.Group();
  root.add(rig);

  const wheel = cartWheel(0.32);
  wheel.name = "fulcrum";
  wheel.position.set(-1.15, -0.86, 0);
  rig.add(wheel);

  const tray = shadow(new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.12, 0.72), paint(0x3f7a58)));
  tray.name = "load";
  tray.position.set(-0.35, -0.55, 0);
  const trayWall = shadow(new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.28, 0.06), paint(0x35684c)));
  trayWall.position.set(-0.35, -0.38, -0.34);
  const trayWall2 = trayWall.clone();
  trayWall2.position.z = 0.34;
  rig.add(tray, trayWall, trayWall2);

  const loadCrate = crate(0.42, 0.32, 0.38);
  loadCrate.position.set(-0.28, -0.28, 0);
  rig.add(loadCrate);

  const handleL = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 1.7, 8), wood(0x7a4e2a)));
  handleL.name = "arms";
  handleL.rotation.z = Math.PI / 2.15;
  handleL.position.set(0.55, -0.62, 0.22);
  const handleR = handleL.clone();
  handleR.position.z = -0.22;
  rig.add(handleL, handleR);

  const grip = grabKnob();
  grip.name = "effort";
  grip.rotation.z = -Math.PI / 2;
  rig.add(grip);

  const layout = () => {
    const tilt = clamp(params.tilt, -0.08, 0.42);
    rig.rotation.z = tilt;
    rig.position.set(0.1, tilt * 0.15, 0);
    const ea = clamp(params.effortArm, 0.9, 2.0);
    grip.position.set(0.35 + ea * 0.55, -0.55, 0);
  };
  layout();

  return {
    root,
    grabTargets: [grip],
    homeCamera: { x: 1.4, y: 1.6, z: 5.0 },
    homeTarget: { x: 0, y: -0.5, z: 0 },
    setParams(next) {
      Object.assign(params, next);
      layout();
    },
    getParams: () => ({ ...params }),
    getForceVectors() {
      const f = leverForces(params.load, params.effortArm, params.loadArm);
      const loadO = new THREE.Vector3();
      loadCrate.getWorldPosition(loadO);
      const effortO = new THREE.Vector3();
      grip.getWorldPosition(effortO);
      const wheelO = new THREE.Vector3();
      wheel.getWorldPosition(wheelO);
      return [
        {
          id: "load",
          label: "Load",
          origin: loadO,
          direction: new THREE.Vector3(0, -1, 0),
          magnitude: Math.min(f.load * 0.28, 85),
          color: 0x3d6b4f,
        },
        {
          id: "effort",
          label: "Effort",
          origin: effortO,
          direction: new THREE.Vector3(0, 1, 0),
          magnitude: Math.min(f.effort * 0.9, 70),
          color: 0xb54a3c,
        },
        {
          id: "fulcrum",
          label: "Wheel reaction",
          origin: wheelO,
          direction: new THREE.Vector3(0, 1, 0),
          magnitude: Math.min((f.load + f.effort) * 0.2, 65),
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
          { label: "Class II MA", value: f.maIdeal.toFixed(2) },
          { label: "Effort (lift handles)", value: `${f.effort.toFixed(1)} N` },
          { label: "Load", value: `${f.load.toFixed(0)} N` },
          { label: "Effort arm", value: `${f.effortArm.toFixed(2)} m` },
          { label: "Load arm", value: `${f.loadArm.toFixed(2)} m` },
        ],
      };
    },
    onDrag(_target, _dx, dy) {
      params.tilt = clamp(params.tilt + dy * 0.7, -0.08, 0.42);
      layout();
      return true;
    },
    tick(dt, demo) {
      if (!demo) return false;
      demoTime += dt;
      params.tilt = 0.14 + Math.sin(demoTime * 0.65) * 0.12;
      layout();
      return true;
    },
    reset() {
      params.effortArm = 1.4;
      params.loadArm = 0.55;
      params.load = 250;
      params.tilt = 0.12;
      demoTime = 0;
      layout();
    },
    setIsolated(isolated) {
      floor.visible = !isolated;
    },
    dispose() {
      disposeObject(root);
    },
  };
}

// ---------------------------------------------------------------------------
// Tongs — Class III lever
// ---------------------------------------------------------------------------

export function createTongs(): MachineAssembly {
  const root = new THREE.Group();
  root.name = "tongs";
  const params: AssemblyParams = { effortArm: 0.45, loadArm: 1.1, load: 40, open: 0.28 };
  let demoTime = 0;

  root.add(bench(3.4, 1.7));

  const tawa = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.52, 0.05, 32), iron(0x3a3c40)));
  tawa.position.set(0.95, -1.05, 0);
  root.add(tawa);
  const tawaHandle = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.55, 8), wood(0x6b3f1f)));
  tawaHandle.rotation.z = Math.PI / 2;
  tawaHandle.position.set(1.48, -1.05, 0.28);
  root.add(tawaHandle);

  const pivot = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.16, 14), brass()));
  pivot.name = "fulcrum";
  pivot.rotation.x = Math.PI / 2;
  pivot.position.set(-1.15, -0.28, 0);
  root.add(pivot);
  const washer = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 14), stainless()));
  washer.rotation.x = Math.PI / 2;
  washer.position.set(-1.15, -0.28, 0.09);
  root.add(washer);

  const steel = stainless();
  const armA = new THREE.Group();
  const armB = new THREE.Group();

  const makeArm = (side: number) => {
    const arm = side > 0 ? armA : armB;
    const shaft = shadow(new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.038, 0.07), steel));
    shaft.position.set(0.76, 0, 0);
    const paddle = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.032, 0.24), steel));
    paddle.position.set(1.68, 0, 0);
    const pad = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.026, 0.2), rubber(0x1a1a1a)));
    pad.name = "load";
    pad.position.set(1.68, side * 0.03, 0);
    const grip = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.036, 0.32, 12), rubber(0xb54a3c)));
    grip.rotation.z = Math.PI / 2;
    grip.position.set(0.36, side * 0.018, 0);
    arm.add(shaft, paddle, pad, grip);
    return { pad, grip };
  };

  const top = makeArm(1);
  const bottom = makeArm(-1);
  top.pad.name = "load";
  top.grip.name = "effort";
  top.grip.userData.grab = true;

  armA.position.copy(pivot.position);
  armB.position.copy(pivot.position);
  root.add(armA, armB);

  const rotiMesh = roti(0.23);
  root.add(rotiMesh);

  const layout = () => {
    const open = clamp(params.open, 0.08, 0.55);
    armA.rotation.z = open;
    armB.rotation.z = -open;
    armA.updateWorldMatrix(true, true);
    armB.updateWorldMatrix(true, true);
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    top.pad.getWorldPosition(a);
    bottom.pad.getWorldPosition(b);
    root.worldToLocal(a);
    root.worldToLocal(b);
    rotiMesh.position.lerpVectors(a, b, 0.5);
    const squeeze = 1 - (0.55 - open) * 0.55;
    rotiMesh.scale.set(1.05, Math.max(0.45, squeeze), 1.05);
    rotiMesh.rotation.z = (0.28 - open) * 0.35;
  };
  layout();

  return {
    root,
    grabTargets: [top.grip],
    homeCamera: { x: 0.4, y: 1.3, z: 4.6 },
    homeTarget: { x: 0, y: -0.35, z: 0 },
    setParams(next) {
      Object.assign(params, next);
      layout();
    },
    getParams: () => ({ ...params }),
    getForceVectors() {
      const f = leverForces(params.load, params.effortArm, params.loadArm);
      const effortO = new THREE.Vector3();
      top.grip.getWorldPosition(effortO);
      const loadO = new THREE.Vector3();
      rotiMesh.getWorldPosition(loadO);
      const fulcrumO = new THREE.Vector3();
      pivot.getWorldPosition(fulcrumO);
      return [
        {
          id: "effort",
          label: "Squeeze",
          origin: effortO,
          direction: new THREE.Vector3(0, -1, 0),
          magnitude: Math.min(f.effort * 1.1, 70),
          color: 0xb54a3c,
        },
        {
          id: "load",
          label: "Grip on roti",
          origin: loadO,
          direction: new THREE.Vector3(0, -1, 0),
          magnitude: Math.min(f.load * 1.4, 60),
          color: 0x3d6b4f,
        },
        {
          id: "fulcrum",
          label: "Pivot",
          origin: fulcrumO,
          direction: new THREE.Vector3(0, 1, 0),
          magnitude: 35,
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
          { label: "Class III MA", value: f.maIdeal.toFixed(2) },
          { label: "Effort (squeeze)", value: `${f.effort.toFixed(1)} N` },
          { label: "Grip force", value: `${f.load.toFixed(0)} N` },
          { label: "Effort arm", value: `${f.effortArm.toFixed(2)} m` },
          { label: "Load arm", value: `${f.loadArm.toFixed(2)} m` },
        ],
      };
    },
    onDrag(_target, _dx, dy) {
      params.open = clamp(params.open - dy * 0.85, 0.08, 0.55);
      layout();
      return true;
    },
    tick(dt, demo) {
      if (!demo) return false;
      demoTime += dt;
      params.open = 0.28 + Math.sin(demoTime * 0.85) * 0.16;
      layout();
      return true;
    },
    reset() {
      params.effortArm = 0.45;
      params.loadArm = 1.1;
      params.load = 40;
      params.open = 0.28;
      demoTime = 0;
      layout();
    },
    setIsolated() {
      /* keep whole tongs visible */
    },
    dispose() {
      disposeObject(root);
    },
  };
}

// ---------------------------------------------------------------------------
// Atwood machine — Class 9 connected masses
// ---------------------------------------------------------------------------

export function createAtwood(): MachineAssembly {
  const root = new THREE.Group();
  root.name = "atwood";
  const params: AssemblyParams = { mass1: 2, mass2: 3.5, drop: 0.35 };
  let demoTime = 0;

  const post = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.8, 12), wood(0x6a4024)));
  post.position.set(0, 0.05, -0.4);
  root.add(post);
  const beam = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.1), wood(0x8a5a32)));
  beam.position.set(0, 1.4, -0.15);
  root.add(beam);
  const foot = bench(2.4, 1.6);
  root.add(foot);

  const pulley = sheave(0.22, 0.055, 0xb08d3a);
  pulley.name = "pulley";
  pulley.position.set(0, 1.38, 0);
  root.add(pulley);

  const leftRope = ropeSeg(1);
  const rightRope = ropeSeg(1);
  root.add(leftRope, rightRope);

  const mass1 = crate(0.32, 0.28, 0.3);
  mass1.name = "m1";
  const mass2 = crate(0.4, 0.36, 0.36);
  mass2.name = "m2";
  mass2.userData.grab = true;
  root.add(mass1, mass2);

  const layout = () => {
    const drop = clamp(params.drop, 0.08, 0.78);
    const top = 1.38;
    const y1 = 0.55 - drop * 0.9;
    const y2 = -0.15 + drop * 0.9;
    mass1.position.set(-0.22, y1, 0);
    mass2.position.set(0.22, y2, 0);
    const len1 = Math.max(0.25, top - y1);
    const len2 = Math.max(0.25, top - y2);
    leftRope.position.set(-0.22, top - len1 / 2, 0);
    leftRope.scale.set(1, len1, 1);
    rightRope.position.set(0.22, top - len2 / 2, 0);
    rightRope.scale.set(1, len2, 1);
    const s1 = 0.85 + params.mass1 * 0.08;
    const s2 = 0.85 + params.mass2 * 0.08;
    mass1.scale.setScalar(s1);
    mass2.scale.setScalar(s2);
  };
  layout();

  return {
    root,
    grabTargets: [mass2],
    homeCamera: { x: 1.6, y: 1.1, z: 5.0 },
    homeTarget: { x: 0, y: 0.2, z: 0 },
    setParams(next) {
      Object.assign(params, next);
      layout();
    },
    getParams: () => ({ ...params }),
    getForceVectors() {
      const f = atwoodForces(params.mass1, params.mass2);
      const o1 = new THREE.Vector3();
      mass1.getWorldPosition(o1);
      const o2 = new THREE.Vector3();
      mass2.getWorldPosition(o2);
      const p = new THREE.Vector3();
      pulley.getWorldPosition(p);
      return [
        {
          id: "w1",
          label: "m1 g",
          origin: o1,
          direction: new THREE.Vector3(0, -1, 0),
          magnitude: Math.min(f.weight1 * 1.4, 70),
          color: 0x2a7ab0,
        },
        {
          id: "w2",
          label: "m2 g",
          origin: o2,
          direction: new THREE.Vector3(0, -1, 0),
          magnitude: Math.min(f.weight2 * 1.1, 85),
          color: 0xb54a3c,
        },
        {
          id: "T",
          label: "Tension T",
          origin: p.clone().add(new THREE.Vector3(0.28, 0, 0)),
          direction: new THREE.Vector3(0, 1, 0),
          magnitude: Math.min(f.tension * 1.2, 70),
          color: 0xc4922a,
        },
      ];
    },
    getHud() {
      const f = atwoodForces(params.mass1, params.mass2);
      return {
        ma: Math.max(params.mass1, params.mass2) / Math.min(params.mass1, params.mass2),
        effort: f.tension,
        load: f.weight2,
        lines: [
          { label: "Mass ratio", value: (Math.max(params.mass1, params.mass2) / Math.min(params.mass1, params.mass2)).toFixed(2) },
          { label: "Acceleration a", value: `${f.acceleration.toFixed(2)} m/s²` },
          { label: "Tension T", value: `${f.tension.toFixed(1)} N` },
          { label: "m1 g", value: `${f.weight1.toFixed(1)} N` },
          { label: "m2 g", value: `${f.weight2.toFixed(1)} N` },
          { label: "Heavier pan", value: f.heavier === 2 ? "m2" : "m1" },
        ],
      };
    },
    onDrag(_target, _dx, dy) {
      params.drop = clamp(params.drop + dy * 0.9, 0.08, 0.78);
      layout();
      return true;
    },
    tick(dt, demo) {
      if (!demo) return false;
      demoTime += dt;
      params.drop = 0.38 + Math.sin(demoTime * 0.7) * 0.28;
      layout();
      return true;
    },
    reset() {
      params.mass1 = 2;
      params.mass2 = 3.5;
      params.drop = 0.35;
      demoTime = 0;
      layout();
    },
    setIsolated(isolated) {
      foot.visible = !isolated;
      post.visible = !isolated;
    },
    dispose() {
      disposeObject(root);
    },
  };
}

// ---------------------------------------------------------------------------
// Hydraulic press — Pascal’s law
// ---------------------------------------------------------------------------

export function createHydraulic(): MachineAssembly {
  const root = new THREE.Group();
  root.name = "hydraulic";
  const params: AssemblyParams = { effort: 80, rEffort: 0.12, rLoad: 0.36, stroke: 0.4 };
  let demoTime = 0;

  root.add(bench(4.2, 2.0));

  const tankW = 2.55;
  const tankH = 0.5;
  const tankD = 0.82;
  const tankY = -0.92;
  const tank = glassReservoir(tankW, tankH, tankD);
  tank.name = "tank";
  tank.position.set(0, tankY, 0);
  root.add(tank);

  const oil = shadow(
    new THREE.Mesh(new THREE.BoxGeometry(tankW - 0.14, tankH * 0.58, tankD - 0.16), oilFill()),
  );
  oil.name = "fluid";
  oil.position.set(0, tankY - tankH * 0.08, 0);
  root.add(oil);

  const smallGlass = glassTube(0.18, 0.78);
  smallGlass.position.set(-0.85, -0.42, 0);
  root.add(smallGlass);
  const smallOil = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.5, 20), oilFill()));
  smallOil.position.set(-0.85, -0.55, 0);
  root.add(smallOil);

  const largeGlass = glassTube(0.46, 0.95);
  largeGlass.position.set(0.85, -0.32, 0);
  root.add(largeGlass);
  const largeOil = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.58, 22), oilFill()));
  largeOil.position.set(0.85, -0.48, 0);
  root.add(largeOil);

  const collarL = shadow(new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.025, 8, 20), brass()));
  collarL.rotation.x = Math.PI / 2;
  collarL.position.set(-0.85, -0.68, 0);
  const collarR = shadow(new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.028, 8, 22), brass()));
  collarR.rotation.x = Math.PI / 2;
  collarR.position.set(0.85, -0.62, 0);
  root.add(collarL, collarR);

  const pipeGlass = shadow(
    new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.45, 16, 1, true), oilFill()),
  );
  pipeGlass.rotation.z = Math.PI / 2;
  pipeGlass.position.set(0, -0.95, 0.38);
  const pipeWall = glassTube(0.08, 1.48);
  pipeWall.rotation.z = Math.PI / 2;
  pipeWall.position.set(0, -0.95, 0.38);
  root.add(pipeGlass, pipeWall);

  const smallPiston = new THREE.Group();
  smallPiston.name = "effort";
  const rod1 = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.55, 12), brass()));
  const piston1 = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.145, 0.06, 18), stainless()));
  piston1.position.y = -0.22;
  const handle = grabKnob();
  handle.position.y = 0.42;
  smallPiston.add(rod1, piston1, handle);
  root.add(smallPiston);

  const largePiston = new THREE.Group();
  largePiston.name = "load";
  const rod2 = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 14), brass()));
  const piston2 = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.07, 22), stainless()));
  piston2.position.y = -0.18;
  const platform = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.08, 22), paint(0x3f7a58)));
  platform.position.y = 0.28;
  const loadCrate = crate(0.5, 0.32, 0.42);
  loadCrate.position.y = 0.5;
  largePiston.add(rod2, piston2, platform, loadCrate);
  root.add(largePiston);

  const layout = () => {
    const stroke = clamp(params.stroke, 0.1, 0.85);
    const r1 = clamp(params.rEffort, 0.08, 0.2) * 1.15;
    const r2 = clamp(params.rLoad, 0.22, 0.5) * 1.05;
    smallGlass.scale.set(r1 / 0.18, 1, r1 / 0.18);
    largeGlass.scale.set(r2 / 0.46, 1, r2 / 0.46);
    smallOil.scale.set(r1 / 0.18, 0.7 + stroke * 0.45, r1 / 0.18);
    largeOil.scale.set(r2 / 0.46, 1.15 - stroke * 0.45, r2 / 0.46);
    smallPiston.position.set(-0.85, -0.15 + stroke * 0.45, 0);
    const rise = (1 - stroke) * 0.55;
    largePiston.position.set(0.85, -0.05 + rise, 0);
    oil.scale.set(1, 0.85 + stroke * 0.18, 1);
  };
  layout();

  return {
    root,
    grabTargets: [handle],
    homeCamera: { x: 1.5, y: 1.5, z: 5.2 },
    homeTarget: { x: 0, y: -0.3, z: 0 },
    setParams(next) {
      Object.assign(params, next);
      layout();
    },
    getParams: () => ({ ...params }),
    getForceVectors() {
      const f = hydraulicForces(params.effort, params.rEffort, params.rLoad);
      const eO = new THREE.Vector3();
      handle.getWorldPosition(eO);
      const lO = new THREE.Vector3();
      loadCrate.getWorldPosition(lO);
      return [
        {
          id: "effort",
          label: "Effort F1",
          origin: eO,
          direction: new THREE.Vector3(0, -1, 0),
          magnitude: Math.min(f.effort * 0.7, 65),
          color: 0xb54a3c,
        },
        {
          id: "load",
          label: "Load F2",
          origin: lO,
          direction: new THREE.Vector3(0, 1, 0),
          magnitude: Math.min(f.load * 0.12, 90),
          color: 0x3d6b4f,
        },
        {
          id: "pressure",
          label: "Pressure P",
          origin: new THREE.Vector3(0, tankY, 0.35),
          direction: new THREE.Vector3(1, 0, 0),
          magnitude: 45,
          color: 0xc4922a,
        },
      ];
    },
    getHud() {
      const f = hydraulicForces(params.effort, params.rEffort, params.rLoad);
      return {
        ma: f.maIdeal,
        effort: f.effort,
        load: f.load,
        lines: [
          { label: "MA (A2 / A1)", value: f.maIdeal.toFixed(2) },
          { label: "Effort F1", value: `${f.effort.toFixed(0)} N` },
          { label: "Load F2", value: `${f.load.toFixed(0)} N` },
          { label: "Pressure", value: `${(f.pressure / 1000).toFixed(2)} kPa` },
          { label: "A2 / A1", value: (f.areaLoad / f.areaEffort).toFixed(2) },
        ],
      };
    },
    onDrag(_target, _dx, dy) {
      params.stroke = clamp(params.stroke + dy * 0.85, 0.1, 0.85);
      layout();
      return true;
    },
    tick(dt, demo) {
      if (!demo) return false;
      demoTime += dt;
      params.stroke = 0.42 + Math.sin(demoTime * 0.6) * 0.28;
      layout();
      return true;
    },
    reset() {
      params.effort = 80;
      params.rEffort = 0.12;
      params.rLoad = 0.36;
      params.stroke = 0.4;
      demoTime = 0;
      layout();
    },
    setIsolated(isolated) {
      tank.visible = !isolated;
      oil.visible = !isolated;
    },
    dispose() {
      disposeObject(root);
    },
  };
}
