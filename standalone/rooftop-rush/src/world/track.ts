import * as THREE from 'three';
import { ROOF_HALF, SEG_BEHIND, SEG_COUNT, SEG_LEN } from '../game/constants';
import { pick, rand, randInt, weighted } from '../game/rng';
import { Builder } from './builder';
import { MAT, getAssets } from './materials';
import { PropKind, createProp } from './props';

interface PropPoolEntry {
  obj: THREE.Group;
  inUse: boolean;
}

interface Segment {
  group: THREE.Group;
  s0: number;
  floor: THREE.Mesh;
  strip: THREE.Mesh;
  blocks: [THREE.Mesh, THREE.Mesh];
  pipes: [THREE.Mesh, THREE.Mesh];
  props: PropPoolEntry[];
}

const BLOCK_WIDTHS = [10, 14, 18];
const BLOCK_LEN = SEG_LEN - 4;
const BLOCK_H = 34;
const SLOT_LEN = 12;

const PROP_WEIGHTS: (readonly [PropKind | null, number])[] = [
  ['garden', 2],
  ['tankBlue', 1.3],
  ['tankRust', 1.3],
  ['solar', 2],
  ['ac', 2],
  ['dish', 1.3],
  ['billboard', 2.2],
  ['vent', 1.4],
  [null, 1.2],
];
const POOL_SIZES: Record<PropKind, number> = { tankBlue: 12, tankRust: 12, dish: 12, solar: 14, ac: 14, garden: 14, billboard: 16, vent: 12 };

/** Facade UVs measured in metres so windows keep a constant size on every building. */
function blockGeometry(w: number): THREE.BoxGeometry {
  const g = new THREE.BoxGeometry(w, BLOCK_H, BLOCK_LEN);
  const uv = g.getAttribute('uv');
  const dims: [number, number][] = [
    [BLOCK_LEN, BLOCK_H],
    [BLOCK_LEN, BLOCK_H],
    [w, BLOCK_LEN],
    [w, BLOCK_LEN],
    [w, BLOCK_H],
    [w, BLOCK_H],
  ];
  for (let f = 0; f < 6; f++) {
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setXY(i, (uv.getX(i) * dims[f][0]) / 6, (uv.getY(i) * dims[f][1]) / 8);
    }
  }
  return g;
}

/**
 * Endless rooftop: a ring of fixed-length segments. When a segment falls behind the runner it is
 * moved to the far end and re-decorated from pooled props, so nothing is allocated during play.
 */
export class Track {
  readonly group = new THREE.Group();
  private segments: Segment[] = [];
  private pools = new Map<PropKind, PropPoolEntry[]>();
  private geos: THREE.BufferGeometry[] = [];
  private blockGeos: THREE.BoxGeometry[] = [];

  constructor() {
    const A = getAssets();
    const floorGeo = new THREE.PlaneGeometry(ROOF_HALF * 2, SEG_LEN);
    floorGeo.rotateX(-Math.PI / 2);
    const slabGeo = new THREE.BoxGeometry(ROOF_HALF * 2 + 0.7, 6, SEG_LEN + 0.06);
    slabGeo.translate(0, -3.02, 0);

    const par = new Builder();
    for (const side of [-1, 1]) {
      const x = side * (ROOF_HALF + 0.2);
      par.box(0.4, 0.55, SEG_LEN, x, 0.275, 0, '#a89cb8');
      const rx = side * (ROOF_HALF + 0.32);
      for (let z = -SEG_LEN / 2 + 2; z < SEG_LEN / 2; z += 4) par.box(0.08, 0.5, 0.08, rx, 0.8, z, '#b7c4dc');
      par.box(0.07, 0.07, SEG_LEN, rx, 1.05, 0, '#c8d4ea');
      par.box(0.06, 0.06, SEG_LEN, rx, 0.75, 0, '#c8d4ea');
    }
    const parGeo = par.geometry();
    const stripB = new Builder();
    for (const side of [-1, 1]) stripB.box(0.12, 0.06, SEG_LEN, side * (ROOF_HALF + 0.2), 0.58, 0, '#ffffff', { glow: true });
    const stripGeo = stripB.flat();
    const pipeGeo = new THREE.CylinderGeometry(0.18, 0.18, SEG_LEN, 8);
    pipeGeo.rotateX(Math.PI / 2);
    this.geos.push(floorGeo, slabGeo, parGeo, stripGeo, pipeGeo);
    const pipeMat = new THREE.MeshStandardMaterial({ color: '#c9704a', roughness: 0.6, metalness: 0.4, flatShading: true });
    this.blockGeos = BLOCK_WIDTHS.map(blockGeometry);

    // prop pools
    (Object.keys(POOL_SIZES) as PropKind[]).forEach((k) => {
      const arr: PropPoolEntry[] = [];
      for (let i = 0; i < POOL_SIZES[k]; i++) {
        const obj = createProp(k, i);
        this.group.add(obj);
        arr.push({ obj, inUse: false });
      }
      this.pools.set(k, arr);
    });

    for (let i = 0; i < SEG_COUNT; i++) {
      const group = new THREE.Group();
      const floor = new THREE.Mesh(floorGeo, A.floorMats[0]);
      floor.receiveShadow = true;
      const slab = new THREE.Mesh(slabGeo, A.slabMat);
      const parapet = new THREE.Mesh(parGeo, [MAT.solid, MAT.glow]);
      const strip = new THREE.Mesh(stripGeo, A.stripMats[0]);
      const b1 = new THREE.Mesh(this.blockGeos[1], A.blockMats[0]);
      const b2 = new THREE.Mesh(this.blockGeos[1], A.blockMats[0]);
      const p1 = new THREE.Mesh(pipeGeo, pipeMat);
      const p2 = new THREE.Mesh(pipeGeo, pipeMat);
      group.add(floor, slab, parapet, strip, b1, b2, p1, p2);
      this.group.add(group);
      this.segments.push({ group, s0: 0, floor, strip, blocks: [b1, b2], pipes: [p1, p2], props: [] });
    }
    this.extraDispose = () => pipeMat.dispose();
    this.reset();
  }

  private extraDispose: () => void = () => undefined;

  reset(): void {
    this.segments.forEach((seg, i) => {
      this.releaseProps(seg);
      seg.s0 = (i - 1) * SEG_LEN;
      this.decorate(seg, i === 1 || i === 2);
      this.place(seg);
    });
  }

  private place(seg: Segment): void {
    seg.group.position.z = -(seg.s0 + SEG_LEN / 2);
  }

  private releaseProps(seg: Segment): void {
    for (const p of seg.props) {
      p.inUse = false;
      p.obj.visible = false;
      p.obj.parent !== this.group && this.group.add(p.obj);
    }
    seg.props.length = 0;
  }

  private acquire(kind: PropKind): PropPoolEntry | null {
    const pool = this.pools.get(kind)!;
    for (const p of pool) if (!p.inUse) return p;
    return null;
  }

  private decorate(seg: Segment, calm: boolean): void {
    const A = getAssets();
    const zc = -(seg.s0 + SEG_LEN / 2);
    seg.floor.material = pick(A.floorMats);
    seg.strip.material = pick(A.stripMats);
    for (let side = 0; side < 2; side++) {
      const sgn = side === 0 ? -1 : 1;
      const wi = randInt(0, BLOCK_WIDTHS.length - 1);
      const w = BLOCK_WIDTHS[wi];
      const blk = seg.blocks[side];
      blk.geometry = this.blockGeos[wi];
      blk.material = pick(A.blockMats);
      const top = rand(-6.5, 0.6);
      blk.position.set(sgn * (ROOF_HALF + 1.2 + w / 2), top - BLOCK_H / 2, 0);
      const pipe = seg.pipes[side];
      pipe.visible = Math.random() < 0.55;
      pipe.position.set(sgn * (ROOF_HALF + 0.55), 0.1, 0);

      // props for this block
      for (let slot = 0; slot < 3; slot++) {
        if (calm && Math.random() < 0.4) continue;
        const kind = weighted(PROP_WEIGHTS);
        if (!kind) continue;
        const entry = this.acquire(kind);
        if (!entry) continue;
        entry.inUse = true;
        seg.props.push(entry);
        const o = entry.obj;
        o.visible = true;
        const zLocal = -SEG_LEN / 2 + 4 + slot * SLOT_LEN + rand(-2.2, 2.2);
        const inner = ROOF_HALF + 1.2;
        const xAbs = inner + rand(2.4, Math.max(2.6, w - 2.4));
        // props are children of the track group; convert to world-of-track coordinates
        o.position.set(sgn * xAbs, top, zc + zLocal);
        const scl = rand(0.9, 1.25);
        o.scale.setScalar(scl);
        if (kind === 'billboard') {
          o.rotation.y = sgn < 0 ? Math.PI / 2 - 0.62 : -(Math.PI / 2 - 0.62);
          const face = o.getObjectByName('face') as THREE.Mesh | undefined;
          if (face) face.material = pick(A.signMats);
        } else {
          o.rotation.y = pick([0, Math.PI / 2, Math.PI, -Math.PI / 2]) + rand(-0.15, 0.15);
        }
      }
    }
  }

  /** Recycles segments that fell behind the runner. */
  update(dist: number): void {
    let far = -Infinity;
    for (const s of this.segments) far = Math.max(far, s.s0);
    for (const seg of this.segments) {
      if (seg.s0 + SEG_LEN < dist - SEG_BEHIND) {
        far += SEG_LEN;
        this.releaseProps(seg);
        seg.s0 = far;
        this.decorate(seg, false);
        this.place(seg);
      }
    }
  }

  dispose(): void {
    this.geos.forEach((g) => g.dispose());
    this.blockGeos.forEach((g) => g.dispose());
    this.extraDispose();
    this.group.clear();
    this.segments = [];
    this.pools.clear();
  }
}
