/**
 * Massive Continuous Indian Monsoon Jungle Labyrinth Layout & Data Engine.
 * Features:
 * - 700+ Giant Canopy Hardwood Trees (Sal/Teak/Banyans) with interlocking crowns.
 * - 800+ Mid-story Sub-canopy Trees filling vertical gaps.
 * - 1200+ Wild Bamboo Stalks in dense wilderness groves.
 * - 1200+ Lush Tropical Foliage & Bushes at eye-level.
 * - Open, unobstructed central spawn glade (no trees landing on player).
 * - 100% clear, guaranteed walkable labyrinth paths from spawn to exit portal.
 * - Organic freshwater pond in central-east clearing.
 * - O(1) spatial hashing collision detection.
 */

export type TreeData = {
  x: number;
  z: number;
  height: number;
  scale: number;
  rotY: number;
  trunkColor: string;
  leafColor: string;
};

export type SubCanopyTreeData = {
  x: number;
  z: number;
  height: number;
  scale: number;
  rotY: number;
  color: string;
};

export type BambooData = {
  x: number;
  z: number;
  h: number;
  scale: number;
  rotY: number;
  tiltX: number;
  tiltZ: number;
  color: string;
};

export type BushData = {
  x: number;
  z: number;
  scale: number;
  rotY: number;
  color: string;
};

export type LilyPadData = {
  x: number;
  z: number;
  scale: number;
  rotY: number;
};

export type PondData = {
  centerX: number;
  centerZ: number;
  radius: number;
  lilyPads: LilyPadData[];
};

export type JungleLayout = {
  size: number;
  gardenHalf: number;
  startWorld: [number, number, number];
  exitWorld: [number, number, number];
  stoneGatewayPos: [number, number, number];
  startYaw: number;
  canopyTrees: TreeData[];
  subCanopyTrees: SubCanopyTreeData[];
  bamboos: BambooData[];
  bushes: BushData[];
  pond: PondData;
  lanterns: [number, number, number][];
  escapePolyline: { x: number; z: number }[];
  pathPolylines: { x: number; z: number }[][];
  isWalkable: (x: number, z: number, radius?: number) => boolean;
  distToPath: (x: number, z: number) => number;
};

export const GARDEN_HALF = 640; // 1280m x 1280m — ~15 min to cross at forest walk speed
const PATH_SCALE = 8;
const PLAYER_RADIUS = 0.4;

type Pt = { x: number; z: number };
type Seg = { a: Pt; b: Pt };

function scalePt(p: Pt): Pt {
  return { x: p.x * PATH_SCALE, z: p.z * PATH_SCALE };
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function distPointSeg(px: number, pz: number, a: Pt, b: Pt) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len2 = dx * dx + dz * dz;
  if (len2 < 1e-8) return Math.hypot(px - a.x, pz - a.z);
  let t = ((px - a.x) * dx + (pz - a.z) * dz) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (a.x + t * dx), pz - (a.z + t * dz));
}

function distToSegments(x: number, z: number, segs: Seg[]) {
  let best = Infinity;
  for (const s of segs) {
    const d = distPointSeg(x, z, s.a, s.b);
    if (d < best) best = d;
  }
  return best;
}

export function generateJungle(seed = 20260818): JungleLayout {
  const rand = mulberry32(seed);

  // Center spawn; green exit at bottom-center of minimap (scaled +Z)
  const startWorld: [number, number, number] = [0, 1.6, 0];
  const exitWorld: [number, number, number] = [0, 0.08, 75 * PATH_SCALE];
  const stoneGatewayPos: [number, number, number] = [0, 0, 75 * PATH_SCALE];

  // Developer Escape Solution Path
  const escapePolyline: Pt[] = [
    { x: 0, z: 0 },
    { x: 0, z: 12 },
    { x: -18, z: 12 },
    { x: -18, z: 28 },
    { x: -34, z: 28 },
    { x: -34, z: 44 },
    { x: -12, z: 44 },
    { x: -12, z: 58 },
    { x: 22, z: 58 },
    { x: 22, z: 68 },
    { x: 0, z: 68 },
    { x: 0, z: 75 },
  ];

  // Branching Jungle Pathways
  const labyrinthBranches: Pt[][] = [
    [
      { x: 0, z: 0 },
      { x: 0, z: -16 },
      { x: 20, z: -16 },
      { x: 20, z: -34 },
      { x: -16, z: -34 },
      { x: -16, z: -52 },
      { x: 14, z: -52 },
      { x: 14, z: -68 },
      { x: -28, z: -68 },
    ],
    [
      { x: 0, z: 12 },
      { x: 26, z: 12 },
      { x: 26, z: -20 },
      { x: 46, z: -20 },
      { x: 46, z: 14 },
      { x: 62, z: 14 },
      { x: 62, z: -40 },
      { x: 42, z: -60 },
    ],
    [
      { x: 22, z: 58 },
      { x: 46, z: 58 },
      { x: 46, z: 32 },
      { x: 34, z: 32 },
      { x: 34, z: 20 },
      { x: 50, z: 20 },
      { x: 50, z: 38 },
    ],
    [
      { x: -18, z: 28 },
      { x: -46, z: 28 },
      { x: -46, z: -12 },
      { x: -32, z: -12 },
      { x: -32, z: -38 },
      { x: -50, z: -38 },
      { x: -50, z: 15 },
      { x: -50, z: 35 },
    ],
    [
      { x: -34, z: 44 },
      { x: -50, z: 44 },
      { x: -50, z: 58 },
      { x: -26, z: 58 },
    ],
    [
      { x: 20, z: -34 },
      { x: 48, z: -34 },
      { x: 48, z: -48 },
      { x: 26, z: -48 },
    ],
    [
      { x: 0, z: 0 },
      { x: -24, z: 0 },
      { x: -24, z: -24 },
      { x: -46, z: -24 },
    ],
    // Dead-end: east fork off the escape path near (-12,44), winds close to exit but stops
    [
      { x: -12, z: 44 },
      { x: 4, z: 44 },
      { x: 4, z: 58 },
      { x: 16, z: 58 },
      { x: 16, z: 66 },
      { x: 8, z: 66 },
    ],
    // Dead-end: NE fork from first turn (0,12), winds northeast into forest depth
    [
      { x: 0, z: 12 },
      { x: 14, z: 12 },
      { x: 14, z: 28 },
      { x: 28, z: 28 },
      { x: 28, z: 44 },
      { x: 40, z: 44 },
      { x: 40, z: 56 },
    ],
    // Dead-end: west deep fork from (-34,28), hooks left then doubles back
    [
      { x: -34, z: 28 },
      { x: -54, z: 28 },
      { x: -54, z: 12 },
      { x: -40, z: 12 },
      { x: -40, z: -4 },
      { x: -56, z: -4 },
    ],
    // Dead-end: south spiral from (-18,12) heading further south before dying
    [
      { x: -18, z: 12 },
      { x: -18, z: -8 },
      { x: -36, z: -8 },
      { x: -36, z: -24 },
      { x: -22, z: -24 },
      { x: -22, z: -42 },
    ],
    // Near-miss: east of the gateway, close enough to glimpse the green circle
    [
      { x: 22, z: 68 },
      { x: 12, z: 68 },
      { x: 12, z: 74 },
      { x: 6, z: 74 },
    ],
    // Near-miss: from the NE corridor, dies in the trees beside the exit
    [
      { x: 22, z: 58 },
      { x: 10, z: 62 },
      { x: 6, z: 70 },
      { x: 8, z: 73 },
    ],
    // Near-miss: west of the gateway
    [
      { x: -12, z: 58 },
      { x: -12, z: 68 },
      { x: -8, z: 72 },
      { x: -5, z: 74 },
    ],
    // Long eastern fake that runs south toward the exit latitude, then stops
    [
      { x: 26, z: 12 },
      { x: 38, z: 28 },
      { x: 38, z: 50 },
      { x: 28, z: 64 },
      { x: 18, z: 72 },
      { x: 14, z: 74 },
    ],
    // Western fake toward the exit, never joins the true last corridor
    [
      { x: -34, z: 44 },
      { x: -40, z: 56 },
      { x: -28, z: 68 },
      { x: -18, z: 72 },
      { x: -14, z: 74 },
    ],
  ];

  const escapeScaled = escapePolyline.map(scalePt);
  const branchesScaled = labyrinthBranches.map((poly) => poly.map(scalePt));
  const allPolylines = [escapeScaled, ...branchesScaled];

  const pathSegments: Seg[] = [];
  allPolylines.forEach((poly) => {
    for (let i = 0; i < poly.length - 1; i++) {
      pathSegments.push({ a: poly[i], b: poly[i + 1] });
    }
  });

  const distToPath = (x: number, z: number) =>
    distToSegments(x, z, pathSegments);

  // 1. Natural Organic Pond (position scaled, radius grown modestly)
  const pond: PondData = {
    centerX: 16 * PATH_SCALE,
    centerZ: 20 * PATH_SCALE,
    radius: 12,
    lilyPads: [],
  };

  for (let i = 0; i < 36; i++) {
    const angle = rand() * Math.PI * 2;
    const rad = 0.3 + rand() * 0.6;
    pond.lilyPads.push({
      x: pond.centerX + Math.cos(angle) * pond.radius * rad,
      z: pond.centerZ + Math.sin(angle) * pond.radius * rad,
      scale: 0.6 + rand() * 0.6,
      rotY: rand() * Math.PI * 2,
    });
  }

  const inPond = (x: number, z: number, margin = 0) => {
    const dx = x - pond.centerX;
    const dz = z - pond.centerZ;
    const r = pond.radius + margin;
    return dx * dx + dz * dz < r * r;
  };

  // Spatial hash grid for fast collision
  const cellSize = 2.0;
  const hash = new Map<string, { x: number; z: number; r: number }[]>();
  const hashKey = (ix: number, iz: number) => `${ix},${iz}`;

  const addCollider = (x: number, z: number, r: number) => {
    const ix = Math.floor(x / cellSize);
    const iz = Math.floor(z / cellSize);
    const key = hashKey(ix, iz);
    const list = hash.get(key);
    if (list) list.push({ x, z, r });
    else hash.set(key, [{ x, z, r }]);
  };

  // 2. 700+ Giant Canopy Trees (Sal, Teak, Banyan with interlocking crowns)
  const canopyTrees: TreeData[] = [];
  const trunkColors = ["#26190f", "#332215", "#20140c", "#3b2718", "#2c1c11"];
  const canopyLeafColors = [
    "#1b421e",
    "#224d24",
    "#183819",
    "#2b572a",
    "#345e28",
    "#1f4722",
  ];

  const MAX_CANOPY = 3200;
  const MAX_SUB = 3600;
  const MAX_BAMBOO = 2800;
  const MAX_BUSH = 3200;

  const tryAddCanopyTree = (x: number, z: number) => {
    if (canopyTrees.length >= MAX_CANOPY) return false;
    const rDist = Math.hypot(x, z);
    if (rDist > GARDEN_HALF - 1.2) return false;

    if (inPond(x, z, 1.5)) return false;

    const dPath = distToPath(x, z);
    const dStart = Math.hypot(x - startWorld[0], z - startWorld[2]);
    const dExit = Math.hypot(x - exitWorld[0], z - exitWorld[2]);

    // Generous clearings so player NEVER spawns in/under trees and paths are fully walkable
    if (dStart < 6.8) return false; // 6.8m spawn clearing
    if (dExit < 5.5) return false; // 5.5m exit clearing
    if (dPath < 3.2) return false; // 3.2m corridor walking clearance

    const ix = Math.floor(x / cellSize);
    const iz = Math.floor(z / cellSize);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const list = hash.get(hashKey(ix + dx, iz + dz));
        if (list) {
          for (const c of list) {
            const diffX = c.x - x;
            const diffZ = c.z - z;
            if (diffX * diffX + diffZ * diffZ < (c.r + 0.5) * (c.r + 0.5)) {
              return false;
            }
          }
        }
      }
    }

    const scale = 0.85 + rand() * 0.9;
    const height = (14.0 + rand() * 7.0) * scale;
    const rotY = rand() * Math.PI * 2;
    const trunkColor = trunkColors[Math.floor(rand() * trunkColors.length)];
    const leafColor = canopyLeafColors[Math.floor(rand() * canopyLeafColors.length)];

    canopyTrees.push({
      x,
      z,
      height,
      scale,
      rotY,
      trunkColor,
      leafColor,
    });

    addCollider(x, z, 0.62 * scale);
    return true;
  };

  // 3. 800+ Mid-story Sub-Canopy Trees
  const subCanopyTrees: SubCanopyTreeData[] = [];
  const subCanopyColors = ["#265224", "#30612d", "#1f451e", "#3a6e34", "#295726"];

  const tryAddSubCanopyTree = (x: number, z: number) => {
    if (subCanopyTrees.length >= MAX_SUB) return false;
    if (Math.hypot(x, z) > GARDEN_HALF - 1.2) return false;
    if (inPond(x, z, 1.4)) return false;
    if (Math.hypot(x - startWorld[0], z - startWorld[2]) < 6.2) return false;
    if (Math.hypot(x - exitWorld[0], z - exitWorld[2]) < 5.0) return false;
    if (distToPath(x, z) < 2.8) return false;

    const scale = 0.7 + rand() * 0.7;
    const height = (7.0 + rand() * 4.0) * scale;
    const rotY = rand() * Math.PI * 2;
    const color = subCanopyColors[Math.floor(rand() * subCanopyColors.length)];

    subCanopyTrees.push({
      x,
      z,
      height,
      scale,
      rotY,
      color,
    });
    addCollider(x, z, 0.38 * scale);
    return true;
  };

  const jitter = () => (rand() - 0.5) * 1.4;

  const forEachPathSample = (
    spacing: number,
    fn: (px: number, pz: number, nx: number, nz: number) => void,
  ) => {
    for (const seg of pathSegments) {
      const dx = seg.b.x - seg.a.x;
      const dz = seg.b.z - seg.a.z;
      const len = Math.hypot(dx, dz) || 1;
      const nx = -dz / len;
      const nz = dx / len;
      const steps = Math.max(1, Math.ceil(len / spacing));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        fn(seg.a.x + dx * t, seg.a.z + dz * t, nx, nz);
      }
    }
  };

  // Dense tree walls along every corridor, then a deep forest band
  forEachPathSample(2.2, (px, pz, nx, nz) => {
    for (const side of [-1, 1] as const) {
      const plant = (offset: number, canopy: boolean) => {
        const x = px + nx * side * offset + jitter();
        const z = pz + nz * side * offset + jitter();
        if (canopy) tryAddCanopyTree(x, z);
        else tryAddSubCanopyTree(x, z);
      };
      plant(3.5 + rand() * 1.6, true);
      plant(4.8 + rand() * 1.6, false);
      plant(7.2 + rand() * 2.2, true);
      plant(10.5 + rand() * 3.0, false);
      plant(16 + rand() * 6, true);
      plant(24 + rand() * 8, false);
      plant(36 + rand() * 12, true);
    }
  });

  // Fill the whole jungle disc so off-path ground is never empty dirt.
  // Shuffle cells so leftover cap budget cannot dump into one corner.
  const forestCells: Pt[] = [];
  const forestStep = 10.5;
  for (let gx = -GARDEN_HALF + 4; gx <= GARDEN_HALF - 4; gx += forestStep) {
    for (let gz = -GARDEN_HALF + 4; gz <= GARDEN_HALF - 4; gz += forestStep) {
      if (gx * gx + gz * gz < (GARDEN_HALF - 3) * (GARDEN_HALF - 3)) {
        forestCells.push({ x: gx, z: gz });
      }
    }
  }
  for (let i = forestCells.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = forestCells[i];
    forestCells[i] = forestCells[j];
    forestCells[j] = tmp;
  }
  for (const cell of forestCells) {
    if (canopyTrees.length >= MAX_CANOPY && subCanopyTrees.length >= MAX_SUB) break;
    const x = cell.x + jitter() * 1.6;
    const z = cell.z + jitter() * 1.6;
    if (rand() > 0.42) tryAddCanopyTree(x, z);
    else tryAddSubCanopyTree(x, z);
  }

  // 4. Wild bamboo groves along scaled path borders
  const bamboos: BambooData[] = [];
  const bambooColors = ["#43782e", "#518a36", "#366624", "#5c9c3e", "#3d702a"];

  const tryAddBamboo = (bx: number, bz: number) => {
    if (bamboos.length >= MAX_BAMBOO) return;
    if (Math.hypot(bx, bz) >= GARDEN_HALF - 0.5) return;
    if (inPond(bx, bz, 1.8)) return;
    if (distToPath(bx, bz) < 2.5) return;
    if (Math.hypot(bx - startWorld[0], bz - startWorld[2]) < 7.0) return;
    const scale = 0.6 + rand() * 0.8;
    bamboos.push({
      x: bx,
      z: bz,
      h: (11.0 + rand() * 6.0) * scale,
      scale,
      rotY: rand() * Math.PI * 2,
      tiltX: (rand() - 0.5) * 0.12,
      tiltZ: (rand() - 0.5) * 0.12,
      color: bambooColors[Math.floor(rand() * bambooColors.length)],
    });
    addCollider(bx, bz, 0.22);
  };

  forEachPathSample(6.5, (px, pz, nx, nz) => {
    for (const side of [-1, 1] as const) {
      const clumpX = px + nx * side * (8 + rand() * 8) + jitter() * 2;
      const clumpZ = pz + nz * side * (8 + rand() * 8) + jitter() * 2;
      const stalks = 10 + Math.floor(rand() * 14);
      for (let s = 0; s < stalks; s++) {
        tryAddBamboo(clumpX + (rand() - 0.5) * 4.0, clumpZ + (rand() - 0.5) * 4.0);
      }
    }
  });

  for (const cell of forestCells) {
    if (bamboos.length >= MAX_BAMBOO) break;
    if (rand() > 0.22) continue;
    tryAddBamboo(cell.x + jitter() * 2, cell.z + jitter() * 2);
  }

  // 5. Eye-level understory wall along every corridor
  const bushes: BushData[] = [];
  const bushColors = ["#1f421f", "#2b592b", "#1a3d1a", "#32632b", "#3b7032"];
  forEachPathSample(1.5, (px, pz, nx, nz) => {
    if (bushes.length >= MAX_BUSH) return;
    for (const side of [-1, 1] as const) {
      if (bushes.length >= MAX_BUSH) return;
      const offset = 2.4 + rand() * 5.5;
      const bx = px + nx * side * offset + jitter();
      const bz = pz + nz * side * offset + jitter();
      if (inPond(bx, bz)) continue;
      if (Math.hypot(bx - startWorld[0], bz - startWorld[2]) < 6.0) continue;
      if (Math.hypot(bx - exitWorld[0], bz - exitWorld[2]) < 5.0) continue;
      if (distToPath(bx, bz) < 2.0) continue;
      const scale = 0.6 + rand() * 1.1;
      bushes.push({
        x: bx,
        z: bz,
        scale,
        rotY: rand() * Math.PI * 2,
        color: bushColors[Math.floor(rand() * bushColors.length)],
      });
      addCollider(bx, bz, 0.45 * scale);
    }
  });

  for (const cell of forestCells) {
    if (bushes.length >= MAX_BUSH) break;
    if (rand() > 0.18) continue;
    const bx = cell.x + jitter() * 2;
    const bz = cell.z + jitter() * 2;
    if (inPond(bx, bz)) continue;
    if (distToPath(bx, bz) < 2.0) continue;
    if (Math.hypot(bx - startWorld[0], bz - startWorld[2]) < 6.0) continue;
    if (Math.hypot(bx - exitWorld[0], bz - exitWorld[2]) < 5.0) continue;
    const scale = 0.7 + rand() * 1.2;
    bushes.push({
      x: bx,
      z: bz,
      scale,
      rotY: rand() * Math.PI * 2,
      color: bushColors[Math.floor(rand() * bushColors.length)],
    });
    addCollider(bx, bz, 0.45 * scale);
  }

  // 6. Ancient Stone Lantern Beacons (XZ scaled with the forest)
  const lanterns: [number, number, number][] = [
    [-2.8, 0.08, 2.5], // Center clearing beacon
    [-18, 0.08, 12],
    [-18, 0.08, 28],
    [-34, 0.08, 44],
    [-12, 0.08, 58],
    [22, 0.08, 58],
    [22, 0.08, 68],
    [0, 0.08, 71], // Approach to Temple Gateway
    [0, 0.08, -16], // South branch
    [20, 0.08, -34],
    [26, 0.08, 12], // East branch
    [46, 0.08, -20],
    [-50, 0.08, 28], // West branch
    [50, 0.08, 58], // North-East branch
  ].map(([x, y, z]): [number, number, number] => [
    x * PATH_SCALE,
    y,
    z * PATH_SCALE,
  ]);

  // Spatial collision check — stay on dirt trails (true path + dead-ends)
  const isWalkable = (x: number, z: number, radius = PLAYER_RADIUS) => {
    if (inPond(x, z, -0.4)) return false;

    const distSq = x * x + z * z;
    if (distSq > GARDEN_HALF * GARDEN_HALF) {
      const ex = x - exitWorld[0];
      const ez = z - exitWorld[2];
      if (ex * ex + ez * ez < 4.5 * 4.5) return true;
      return false;
    }

    const dStart = Math.hypot(x - startWorld[0], z - startWorld[2]);
    const dExit = Math.hypot(x - exitWorld[0], z - exitWorld[2]);
    const onTrail = distToPath(x, z) < 2.15;
    if (!onTrail && dStart > 6.8 && dExit > 5.5) return false;

    const ix = Math.floor(x / cellSize);
    const iz = Math.floor(z / cellSize);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const list = hash.get(hashKey(ix + dx, iz + dz));
        if (!list) continue;
        for (const c of list) {
          const diffX = c.x - x;
          const diffZ = c.z - z;
          const reqDist = radius + c.r;
          if (diffX * diffX + diffZ * diffZ < reqDist * reqDist) {
            return false;
          }
        }
      }
    }
    return true;
  };

  return {
    size: GARDEN_HALF * 2,
    gardenHalf: GARDEN_HALF,
    startWorld,
    exitWorld,
    stoneGatewayPos,
    startYaw: 0,
    canopyTrees,
    subCanopyTrees,
    bamboos,
    bushes,
    pond,
    lanterns,
    escapePolyline: escapeScaled,
    pathPolylines: allPolylines,
    isWalkable,
    distToPath,
  };
}

export const JUNGLE_LAYOUT = generateJungle(20260818);
