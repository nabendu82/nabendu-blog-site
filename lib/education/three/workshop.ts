import * as THREE from "three";

/** Shared workshop look: wood, iron, hemp, crates. Textures are lazy so SSR stays safe. */

let woodMap: THREE.CanvasTexture | null = null;
let ironMap: THREE.CanvasTexture | null = null;
let ropeMap: THREE.CanvasTexture | null = null;
let plankMap: THREE.CanvasTexture | null = null;

function canvasTex(
  size: number,
  paint: (ctx: CanvasRenderingContext2D, size: number) => void,
  repeat = 2,
) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) paint(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function getWoodMap() {
  if (woodMap) return woodMap;
  woodMap = canvasTex(512, (ctx, s) => {
    ctx.fillStyle = "#8b5e34";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 48; i += 1) {
      const x = (i / 48) * s + Math.sin(i * 1.7) * 6;
      ctx.strokeStyle = `rgba(50, 28, 12, ${0.08 + (i % 5) * 0.03})`;
      ctx.lineWidth = 2 + (i % 3);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      for (let y = 0; y <= s; y += 16) {
        ctx.lineTo(x + Math.sin(y * 0.04 + i) * 8, y);
      }
      ctx.stroke();
    }
    for (let i = 0; i < 18; i += 1) {
      ctx.fillStyle = `rgba(40, 22, 8, ${0.06 + (i % 4) * 0.03})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 18, 3);
    }
  }, 1.6);
  return woodMap;
}

function getIronMap() {
  if (ironMap) return ironMap;
  ironMap = canvasTex(256, (ctx, s) => {
    ctx.fillStyle = "#6d737a";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 900; i += 1) {
      const v = 90 + Math.floor(Math.random() * 50);
      ctx.fillStyle = `rgb(${v},${v + 2},${v + 4})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
    }
  }, 3);
  return ironMap;
}

function getRopeMap() {
  if (ropeMap) return ropeMap;
  ropeMap = canvasTex(128, (ctx, s) => {
    ctx.fillStyle = "#c4a574";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 16; i += 1) {
      ctx.strokeStyle = i % 2 ? "#9a7a4a" : "#d8bf8e";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, (i / 16) * s);
      ctx.lineTo(s, (i / 16) * s + 8);
      ctx.stroke();
    }
  }, 4);
  return ropeMap;
}

function getPlankMap() {
  if (plankMap) return plankMap;
  plankMap = canvasTex(512, (ctx, s) => {
    ctx.fillStyle = "#6f4b2c";
    ctx.fillRect(0, 0, s, s);
    const plankH = s / 6;
    for (let i = 0; i < 6; i += 1) {
      ctx.fillStyle = i % 2 ? "#7a5332" : "#654427";
      ctx.fillRect(0, i * plankH, s, plankH - 4);
      ctx.fillStyle = "rgba(30,16,6,0.35)";
      ctx.fillRect(0, (i + 1) * plankH - 4, s, 4);
    }
  }, 1);
  return plankMap;
}

export function wood(color = 0xb08968) {
  return new THREE.MeshStandardMaterial({
    map: getWoodMap(),
    color,
    roughness: 0.84,
    metalness: 0.04,
    envMapIntensity: 0.35,
  });
}

export function iron(color = 0x6a727c) {
  return new THREE.MeshStandardMaterial({
    map: getIronMap(),
    color,
    roughness: 0.42,
    metalness: 0.72,
    envMapIntensity: 0.85,
  });
}

export function brass(color = 0xb08d3a) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.32,
    metalness: 0.78,
    envMapIntensity: 0.95,
  });
}

export function paint(color: number) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.55,
    metalness: 0.12,
    envMapIntensity: 0.55,
  });
}

export function hemp() {
  return new THREE.MeshStandardMaterial({
    map: getRopeMap(),
    color: 0xd4b48a,
    roughness: 0.95,
    metalness: 0,
  });
}

export function rubber(color = 0x2c2420) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.92,
    metalness: 0.02,
  });
}

export function stainless() {
  return new THREE.MeshStandardMaterial({
    color: 0xc8d0d6,
    roughness: 0.22,
    metalness: 0.88,
    envMapIntensity: 1.15,
  });
}

export function clearGlass() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xf2f7fb,
    roughness: 0.04,
    metalness: 0,
    transmission: 0.94,
    thickness: 0.22,
    ior: 1.48,
    transparent: true,
    opacity: 1,
    envMapIntensity: 1.35,
    side: THREE.DoubleSide,
  });
}

export function oilFill() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xc4922a,
    roughness: 0.16,
    metalness: 0,
    transmission: 0.42,
    thickness: 0.7,
    transparent: true,
    opacity: 0.82,
    attenuationColor: 0x8a5a12,
    attenuationDistance: 0.45,
  });
}

export function oilGlass() {
  return oilFill();
}

export function plankFloor() {
  return new THREE.MeshStandardMaterial({
    map: getPlankMap(),
    color: 0xc4a078,
    roughness: 0.88,
    metalness: 0.02,
    envMapIntensity: 0.3,
  });
}

export function shadow(mesh: THREE.Mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function crate(w: number, h: number, d: number) {
  const group = new THREE.Group();
  group.name = "load";
  const body = shadow(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wood(0xa56b3c)));
  group.add(body);
  const batten = wood(0x6e4324);
  const t = Math.min(w, d) * 0.08;
  for (const x of [-w / 2 + t, w / 2 - t]) {
    const slat = shadow(new THREE.Mesh(new THREE.BoxGeometry(t * 1.2, h + 0.012, d + 0.012), batten));
    slat.position.x = x;
    group.add(slat);
  }
  const strap = shadow(new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, t, d + 0.02), iron(0x5a616a)));
  strap.position.y = h * 0.12;
  group.add(strap);
  return group;
}

let rotiMap: THREE.CanvasTexture | null = null;

function getRotiMap() {
  if (rotiMap) return rotiMap;
  rotiMap = canvasTex(
    256,
    (ctx, s) => {
      ctx.fillStyle = "#e2c089";
      ctx.fillRect(0, 0, s, s);
      const g = ctx.createRadialGradient(s * 0.5, s * 0.5, 8, s * 0.5, s * 0.5, s * 0.55);
      g.addColorStop(0, "#f0d4a0");
      g.addColorStop(0.7, "#d4a45c");
      g.addColorStop(1, "#b07a38");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(s * 0.5, s * 0.5, s * 0.48, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 28; i += 1) {
        const a = Math.random() * Math.PI * 2;
        const r = 20 + Math.random() * 90;
        ctx.fillStyle = `rgba(92, 48, 16, ${0.18 + Math.random() * 0.35})`;
        ctx.beginPath();
        ctx.ellipse(
          s * 0.5 + Math.cos(a) * r,
          s * 0.5 + Math.sin(a) * r,
          4 + Math.random() * 10,
          3 + Math.random() * 7,
          a,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.fillStyle = "rgba(255, 245, 220, 0.18)";
      for (let i = 0; i < 40; i += 1) {
        ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
      }
    },
    1,
  );
  rotiMap.wrapS = THREE.ClampToEdgeWrapping;
  rotiMap.wrapT = THREE.ClampToEdgeWrapping;
  rotiMap.repeat.set(1, 1);
  return rotiMap;
}

/** Flattened tandoori-style roti with char spots. */
export function roti(radius = 0.24) {
  const group = new THREE.Group();
  group.name = "roti";
  const mat = new THREE.MeshStandardMaterial({
    map: getRotiMap(),
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0,
  });
  const puff = new THREE.SphereGeometry(radius, 28, 16);
  puff.scale(1, 0.13, 1);
  const disc = shadow(new THREE.Mesh(puff, mat));
  group.add(disc);
  return group;
}

/** Open-top glass trough so the oil inside is visible. */
export function glassReservoir(width: number, height: number, depth: number, wall = 0.04) {
  const group = new THREE.Group();
  const glass = clearGlass();
  const bottom = shadow(new THREE.Mesh(new THREE.BoxGeometry(width, wall, depth), glass));
  bottom.position.y = -height / 2 + wall / 2;
  const front = shadow(new THREE.Mesh(new THREE.BoxGeometry(width, height, wall), glass));
  front.position.z = depth / 2 - wall / 2;
  const back = front.clone();
  back.position.z = -depth / 2 + wall / 2;
  const side = new THREE.BoxGeometry(wall, height, depth);
  const left = shadow(new THREE.Mesh(side, glass));
  left.position.x = -width / 2 + wall / 2;
  const right = shadow(new THREE.Mesh(side.clone(), glass));
  right.position.x = width / 2 - wall / 2;
  const rim = shadow(
    new THREE.Mesh(new THREE.BoxGeometry(width + 0.04, 0.03, depth + 0.04), brass()),
  );
  rim.position.y = height / 2 - 0.01;
  group.add(bottom, front, back, left, right, rim);
  return group;
}

export function glassTube(radius: number, height: number) {
  const group = new THREE.Group();
  const wall = shadow(
    new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, height, 24, 1, true),
      clearGlass(),
    ),
  );
  group.add(wall);
  return group;
}

export function grabKnob() {
  const group = new THREE.Group();
  group.userData.grab = true;
  const stem = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.04, 0.14, 10), wood(0x6b3f1f)));
  const knob = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 12), rubber(0x3a2a22)));
  knob.position.y = 0.09;
  group.add(stem, knob);
  return group;
}

export function bolt(radius = 0.045) {
  const group = new THREE.Group();
  const head = shadow(new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.035, 6), iron(0x8a9098)));
  const shaft = shadow(new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.55, radius * 0.55, 0.08, 8), iron(0x6a7078)));
  shaft.position.y = -0.04;
  group.add(head, shaft);
  return group;
}

export function helixMesh(radius: number, height: number, turns: number, tube = 0.028, color = 0x8a9098) {
  const pts: THREE.Vector3[] = [];
  const n = Math.max(32, Math.round(turns * 28));
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    const a = t * turns * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, (t - 0.5) * height, Math.sin(a) * radius));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curve, n, tube, 6, false);
  return shadow(new THREE.Mesh(geo, iron(color)));
}

export function sheave(radius: number, tube: number, color: number) {
  const group = new THREE.Group();
  const rim = shadow(new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 10, 28), iron(color)));
  rim.rotation.y = Math.PI / 2;
  const plate = iron(0x4a5560);
  const left = shadow(new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.82, radius * 0.82, 0.045, 22), plate));
  left.rotation.z = Math.PI / 2;
  left.position.x = -tube * 0.85;
  const right = left.clone();
  right.position.x = tube * 0.85;
  group.add(rim, left, right);
  return group;
}

export function bench(width = 4.2, depth = 2.0) {
  const group = new THREE.Group();
  const top = shadow(new THREE.Mesh(new THREE.BoxGeometry(width, 0.1, depth), wood(0x8a5a32)));
  top.position.y = -1.18;
  group.add(top);
  for (const x of [-width * 0.42, width * 0.42]) {
    for (const z of [-depth * 0.38, depth * 0.38]) {
      const leg = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, 0.12), wood(0x6a4024)));
      leg.position.set(x, -1.44, z);
      group.add(leg);
    }
  }
  return group;
}

export function cartWheel(radius: number) {
  const group = new THREE.Group();
  const rim = shadow(new THREE.Mesh(new THREE.TorusGeometry(radius, 0.055, 10, 28), wood(0x7a4e2a)));
  rim.rotation.y = Math.PI / 2;
  const hub = shadow(new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.16, radius * 0.16, 0.14, 12), iron(0x5a616a)));
  hub.rotation.z = Math.PI / 2;
  group.add(rim, hub);
  const spokeMat = wood(0x8a5a32);
  for (let i = 0; i < 8; i += 1) {
    const spoke = shadow(new THREE.Mesh(new THREE.BoxGeometry(radius * 1.75, 0.04, 0.045), spokeMat));
    spoke.rotation.z = (i * Math.PI) / 8;
    group.add(spoke);
  }
  const tyre = shadow(new THREE.Mesh(new THREE.TorusGeometry(radius, 0.035, 8, 24), rubber(0x2a2624)));
  tyre.rotation.y = Math.PI / 2;
  group.add(tyre);
  return group;
}
