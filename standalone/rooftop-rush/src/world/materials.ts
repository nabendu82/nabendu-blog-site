import * as THREE from 'three';

const TAU = Math.PI * 2;
const FONT = '"Noto Sans Devanagari","Kohinoor Devanagari","Devanagari Sangam MN","Nirmala UI","Mangal",system-ui,sans-serif';

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

function tex(c: HTMLCanvasElement, srgb = true, repeat = false): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

/** Seeded PRNG so paired canvases share layouts. */
function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const disposables: { dispose(): void }[] = [];
const track = <T extends { dispose(): void }>(o: T): T => {
  disposables.push(o);
  return o;
};

/* ---------- textures ---------- */

function makeFloorTexture(): THREE.CanvasTexture {
  const W = 256;
  const H = 1024;
  const [c, g] = canvas(W, H);
  const rnd = mulberry(7);
  g.fillStyle = '#8a8497';
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 1400; i++) {
    const v = 120 + rnd() * 50;
    g.fillStyle = `rgba(${v},${v - 6},${v + 14},${0.1 + rnd() * 0.14})`;
    g.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 3, 1 + rnd() * 3);
  }
  // slab seams every 1/5 of the segment
  g.fillStyle = 'rgba(30,24,50,0.55)';
  for (let i = 0; i < 5; i++) g.fillRect(0, i * (H / 5) - 2, W, i === 0 ? 5 : 3);
  // lane dividers (dashed) at lane boundaries (x = +-1.2 of 8.4)
  g.fillStyle = 'rgba(255,240,225,0.75)';
  for (const u of [0.5 - 1.2 / 8.4, 0.5 + 1.2 / 8.4]) {
    for (let y = 0; y < H; y += H / 8) g.fillRect(u * W - 2, y + 6, 4, H / 8 - 30);
  }
  // edge lines
  g.fillStyle = 'rgba(255,138,31,0.9)';
  g.fillRect(6, 0, 4, H);
  g.fillRect(W - 10, 0, 4, H);
  // faint direction chevrons in centre lane
  g.strokeStyle = 'rgba(25,201,230,0.2)';
  g.lineWidth = 4;
  for (let y = 60; y < H; y += H / 4) {
    g.beginPath();
    g.moveTo(W / 2 - 20, y + 20);
    g.lineTo(W / 2, y);
    g.lineTo(W / 2 + 20, y + 20);
    g.stroke();
  }
  const t = tex(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.anisotropy = 8;
  return t;
}

function makeFacade(seed: number, cols: number, rows: number, cw: number, ch: number): { map: THREE.CanvasTexture; emissive: THREE.CanvasTexture } {
  const [c1, g1] = canvas(cols * cw, rows * ch);
  const [c2, g2] = canvas(cols * cw, rows * ch);
  const rnd = mulberry(seed);
  g1.fillStyle = '#e8e2ee';
  g1.fillRect(0, 0, c1.width, c1.height);
  g2.fillStyle = '#000';
  g2.fillRect(0, 0, c2.width, c2.height);
  const lit = ['#ffd58a', '#ffb36b', '#ff9ec4', '#8fe9ff', '#fff2c4'];
  for (let r = 0; r < rows; r++) {
    for (let cIdx = 0; cIdx < cols; cIdx++) {
      const x = cIdx * cw + cw * 0.18;
      const y = r * ch + ch * 0.2;
      const w = cw * 0.64;
      const h = ch * 0.6;
      const on = rnd() < 0.42;
      const col = lit[Math.floor(rnd() * lit.length)];
      g1.fillStyle = on ? col : '#2a2f52';
      g1.fillRect(x, y, w, h);
      if (on) {
        g2.fillStyle = col;
        g2.fillRect(x, y, w, h);
      }
    }
    g1.fillStyle = 'rgba(80,60,110,0.25)';
    g1.fillRect(0, r * ch + ch - 3, c1.width, 3);
  }
  return { map: tex(c1, true, true), emissive: tex(c2, true, true) };
}

export function makeNeonTexture(lines: string[], color: string, bg: string, accent = color): THREE.CanvasTexture {
  const W = 512;
  const H = 256;
  const [c, g] = canvas(W, H);
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.lineWidth = 10;
  g.strokeStyle = accent;
  g.shadowColor = accent;
  g.shadowBlur = 22;
  g.strokeRect(14, 14, W - 28, H - 28);
  g.shadowBlur = 24;
  g.fillStyle = color;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  if (lines.length === 1) {
    g.font = `800 96px ${FONT}`;
    g.fillText(lines[0], W / 2, H / 2 + 4, W - 70);
  } else {
    g.font = `800 84px ${FONT}`;
    g.fillText(lines[0], W / 2, H * 0.38, W - 70);
    g.font = `700 48px ${FONT}`;
    g.fillStyle = accent;
    g.fillText(lines[1], W / 2, H * 0.74, W - 70);
  }
  return tex(c);
}

function makeGlowSprite(): THREE.CanvasTexture {
  const [c, g] = canvas(64, 64);
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return tex(c);
}

function makeBlob(): THREE.CanvasTexture {
  const [c, g] = canvas(64, 64);
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(0,0,0,0.75)');
  grd.addColorStop(0.6, 'rgba(0,0,0,0.35)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return tex(c);
}

/* ---------- shared materials ---------- */

const SIGN_DEFS: [string[], string, string, string][] = [
  [['चाय • CHAI'], '#ffe9a8', '#3a1330', '#ff8a1f'],
  [['नियो बाज़ार', 'NEO BAZAAR'], '#8ff8ff', '#101a3a', '#19c9e6'],
  [['रफ़्तार', 'RAFTAAR ⚡'], '#ffd0ef', '#2b0e3a', '#ff3d8b'],
  [['जय हो!', '✦ JAI HO ✦'], '#fff2c4', '#2d1408', '#ffb020'],
  [['मेट्रो ७', 'METRO 7 ▶'], '#d8ffb0', '#0d2a26', '#b6ff3c'],
  [['मसाला बॉट', 'MASALA-BOT'], '#ffd6b0', '#3a0f1a', '#ff5a3d'],
  [['डिजिटल हाट'], '#c9b8ff', '#160f3a', '#8a63ff'],
  [['नव भारत', '◈ NAV BHARAT ◈'], '#b0f4ff', '#08202e', '#3df0d0'],
];

export interface SharedAssets {
  floorTex: THREE.CanvasTexture;
  glowTex: THREE.CanvasTexture;
  blobTex: THREE.CanvasTexture;
  duckSignTex: THREE.CanvasTexture;
  signMats: THREE.MeshBasicMaterial[];
  floorMats: THREE.MeshStandardMaterial[];
  slabMat: THREE.MeshStandardMaterial;
  blockMats: THREE.Material[][];
  stripMats: THREE.MeshBasicMaterial[];
  skylineMat: THREE.MeshStandardMaterial;
  farSkylineMat: THREE.MeshStandardMaterial;
  duckSignMat: THREE.MeshBasicMaterial;
}

export const MAT = {
  solid: new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.78, metalness: 0.08 }),
  glow: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
  rotor: new THREE.MeshBasicMaterial({ color: '#8ff8ff', transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }),
  void: new THREE.MeshBasicMaterial({ color: '#07030f', polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
};
track(MAT.solid);
track(MAT.glow);
track(MAT.rotor);
track(MAT.void);

let assets: SharedAssets | null = null;

export function getAssets(): SharedAssets {
  if (assets) return assets;
  const floorTex = track(makeFloorTexture());
  const glowTex = track(makeGlowSprite());
  const blobTex = track(makeBlob());
  const duckSignTex = track(makeNeonTexture(['झुको ▼', 'DUCK ▼▼'], '#ffd0ef', '#2b0e3a', '#ff3d8b'));
  const signMats = SIGN_DEFS.map((d) => track(new THREE.MeshBasicMaterial({ map: track(makeNeonTexture(...d)), toneMapped: false })));
  const floorTints = ['#ffffff', '#f3e6ff', '#ffe6d2', '#dff0ff'];
  const floorMats = floorTints.map((c) => track(new THREE.MeshStandardMaterial({ map: floorTex, color: c, roughness: 0.9, metalness: 0.02 })));
  const slabMat = track(new THREE.MeshStandardMaterial({ color: '#57506a', roughness: 1 }));

  const facade = makeFacade(21, 4, 8, 32, 32);
  track(facade.map);
  track(facade.emissive);
  const wallColors = ['#e39a7b', '#efc08a', '#84c2c2', '#d68cb0', '#9c96dc', '#e6d27a'];
  const roofColors = ['#8a6a78', '#8f7f6a', '#5f8080', '#845d78', '#6e6a96', '#8c8556'];
  const blockMats = wallColors.map((wc, i) => {
    const wall = track(
      new THREE.MeshStandardMaterial({ color: wc, map: facade.map, emissiveMap: facade.emissive, emissive: '#ffffff', emissiveIntensity: 0.9, roughness: 0.9 })
    );
    const roof = track(new THREE.MeshStandardMaterial({ color: roofColors[i], roughness: 1 }));
    return [wall, wall, roof, wall, wall, wall];
  });

  const stripCols = [PAL.cyanGlow, PAL.orange, PAL.magenta, PAL.lime];
  const stripMats = stripCols.map((c) => track(new THREE.MeshBasicMaterial({ color: c, toneMapped: false })));

  const sky = makeFacade(5, 6, 16, 16, 16);
  track(sky.map);
  track(sky.emissive);
  const skylineMat = track(
    new THREE.MeshStandardMaterial({ map: sky.map, emissiveMap: sky.emissive, emissive: '#ffffff', emissiveIntensity: 0.85, roughness: 1 })
  );
  const farSkylineMat = track(
    new THREE.MeshStandardMaterial({ map: sky.map, emissiveMap: sky.emissive, emissive: '#ffffff', emissiveIntensity: 1.0, roughness: 1 })
  );
  const duckSignMat = track(new THREE.MeshBasicMaterial({ map: duckSignTex, toneMapped: false }));

  assets = { floorTex, glowTex, blobTex, duckSignTex, signMats, floorMats, slabMat, blockMats, stripMats, skylineMat, farSkylineMat, duckSignMat };
  return assets;
}

const PAL = { cyanGlow: '#7ffcff', orange: '#ff8a1f', magenta: '#ff3d8b', lime: '#b6ff3c' };

export function disposeSharedAssets(): void {
  for (const d of disposables) d.dispose();
  assets = null;
}

export { TAU };
