import * as THREE from 'three';
import { Builder } from './builder';
import { MAT, getAssets } from './materials';

export type PropKind = 'tankBlue' | 'tankRust' | 'dish' | 'solar' | 'ac' | 'garden' | 'billboard' | 'vent';

const geos = new Map<PropKind, THREE.BufferGeometry>();
let billboardFaceGeo: THREE.PlaneGeometry | null = null;

function tank(body: string, band: string): Builder {
  const b = new Builder();
  for (const sx of [-0.62, 0.62]) for (const sz of [-0.62, 0.62]) b.box(0.13, 0.9, 0.13, sx, 0.45, sz, '#3a3550');
  b.box(1.8, 0.12, 1.8, 0, 0.9, 0, '#6b4a3a');
  b.cyl(1.0, 1.0, 1.6, 0, 1.76, 0, body, undefined, 12);
  b.cyl(1.04, 1.04, 0.12, 0, 1.25, 0, band, undefined, 12);
  b.cyl(1.04, 1.04, 0.12, 0, 2.15, 0, band, undefined, 12);
  b.cyl(0.0, 1.05, 0.55, 0, 2.82, 0, '#3a3550', undefined, 12);
  b.sphere(0.1, 0, 3.15, 0, '#ff3d3d', { glow: true });
  b.box(0.08, 2.2, 0.06, 0.9, 1.1, 0.5, '#2c2840');
  for (let i = 0; i < 5; i++) b.box(0.4, 0.05, 0.05, 0.9, 0.5 + i * 0.4, 0.5, '#2c2840');
  return b;
}

function build(kind: PropKind): Builder {
  const b = new Builder();
  switch (kind) {
    case 'tankBlue':
      return tank('#2fa1bd', '#ff8a1f');
    case 'tankRust':
      return tank('#c8674a', '#f2d08a');
    case 'dish': {
      b.cyl(0.07, 0.1, 1.5, 0, 0.75, 0, '#b9c3d6');
      b.box(0.9, 0.12, 0.9, 0, 0.06, 0, '#4a4560');
      b.custom(new THREE.SphereGeometry(0.95, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2.4), '#f2f4fa', 0, 1.7, 0, { rx: -0.95, ry: 0.2, sy: 1, sx: 1, sz: 1 });
      b.box(0.05, 0.05, 0.95, 0, 2.05, -0.5, '#9aa4b8', { rx: 0.35 });
      b.sphere(0.09, 0, 2.25, -0.85, '#ff3d3d', { glow: true });
      return b;
    }
    case 'solar': {
      for (const px of [-1.3, 0, 1.3]) {
        b.box(1.2, 0.07, 1.7, px, 0.8, 0, '#1b3a7a', { rx: -0.5 });
        b.box(1.26, 0.09, 0.05, px, 0.8, 0, '#c8d4e8', { rx: -0.5 });
        for (const k of [-0.4, 0.4]) b.box(0.05, 0.09, 1.7, px + k, 0.8, 0, '#5b8ee0', { rx: -0.5 });
        b.box(0.1, 0.55, 0.1, px - 0.5, 0.28, 0.4, '#8f98ac');
        b.box(0.1, 0.9, 0.1, px + 0.5, 0.45, -0.4, '#8f98ac');
      }
      return b;
    }
    case 'ac': {
      for (let i = 0; i < 3; i++) {
        const x = -1 + i * 1.0;
        b.box(0.9, 0.75, 0.8, x, 0.55, 0, '#d8dce8');
        b.cyl(0.32, 0.32, 0.05, x, 0.6, 0.41, '#2a3350', { rx: Math.PI / 2 });
        b.box(0.5, 0.05, 0.02, x, 0.6, 0.44, '#7ffcff', { glow: true });
        b.box(0.94, 0.08, 0.84, x, 0.96, 0, '#aab2c6');
        b.box(0.6, 0.12, 0.6, x, 0.06, 0, '#4a4560');
      }
      b.cyl(0.07, 0.07, 2.4, 0, 0.95, -0.5, '#ff8a1f', { rz: Math.PI / 2 });
      return b;
    }
    case 'garden': {
      b.box(3.0, 0.5, 1.4, 0, 0.25, 0, '#a5623f');
      b.box(2.84, 0.06, 1.24, 0, 0.5, 0, '#4a3324');
      const greens = ['#3dbb5c', '#2f9c4a', '#67d36a', '#249447'];
      for (let i = 0; i < 6; i++) b.sphere(0.32 + (i % 3) * 0.06, -1.2 + i * 0.48, 0.75, (i % 2 ? 0.25 : -0.25), greens[i % 4], undefined, 7);
      b.cyl(0.08, 0.12, 1.5, 1.0, 1.25, 0.1, '#7a5230');
      b.sphere(0.6, 1.0, 2.15, 0.1, '#2f9c4a', undefined, 7);
      b.sphere(0.45, 1.35, 1.95, 0.25, '#3dbb5c', undefined, 7);
      b.sphere(0.45, 0.65, 1.95, -0.1, '#249447', undefined, 7);
      const fl = ['#ff5fa8', '#ffd23f', '#ff8a1f', '#ffffff'];
      for (let i = 0; i < 9; i++) b.sphere(0.09, -1.3 + i * 0.32, 0.98, (i % 2 ? 0.3 : -0.3), fl[i % 4], undefined, 5);
      b.cyl(0.04, 0.04, 1.7, -1.45, 0.85, 0.6, '#5a5470');
      b.cyl(0.04, 0.04, 1.7, 1.45, 0.85, 0.6, '#5a5470');
      for (let i = 0; i < 7; i++) b.sphere(0.07, -1.45 + i * 0.483, 1.68 - Math.sin((i / 6) * Math.PI) * 0.22, 0.6, i % 2 ? '#ffd23f' : '#ff7ac0', { glow: true }, 5);
      return b;
    }
    case 'billboard': {
      b.cyl(0.11, 0.14, 3.6, -1.7, 1.8, 0, '#4a4560');
      b.cyl(0.11, 0.14, 3.6, 1.7, 1.8, 0, '#4a4560');
      b.box(4.8, 2.5, 0.22, 0, 4.45, 0, '#2a2540');
      b.box(4.9, 0.14, 0.9, 0, 3.15, 0.3, '#5a5470');
      for (const lx of [-1.6, 0, 1.6]) {
        b.box(0.1, 0.1, 0.5, lx, 5.9, 0.35, '#8f98ac');
        b.box(0.28, 0.1, 0.16, lx, 5.9, 0.62, '#fff2c4', { glow: true });
      }
      return b;
    }
    case 'vent': {
      b.box(1.8, 1.4, 1.6, -0.6, 0.7, 0, '#d9b98a');
      b.box(2.0, 0.14, 1.8, -0.6, 1.47, 0, '#8a5a4a');
      b.box(0.4, 0.8, 0.05, -0.6, 0.4, 0.82, '#ffb36b', { glow: true });
      b.cyl(0.28, 0.32, 2.0, 0.9, 1.0, 0.2, '#b9b0c8', undefined, 8);
      b.cyl(0.42, 0.28, 0.2, 0.9, 2.05, 0.2, '#6d6785', undefined, 8);
      b.cyl(0.16, 0.16, 1.2, 1.5, 0.6, -0.5, '#8f98ac', undefined, 8);
      b.cyl(0.22, 0.16, 0.14, 1.5, 1.25, -0.5, '#6d6785', undefined, 8);
      return b;
    }
  }
}

export function getPropGeometry(kind: PropKind): THREE.BufferGeometry {
  let g = geos.get(kind);
  if (!g) {
    const b = build(kind);
    g = b.geometry();
    b.dispose();
    geos.set(kind, g);
  }
  return g;
}

/** Creates a prop instance (shares geometry & materials). Billboards get a textured face child. */
export function createProp(kind: PropKind, index: number): THREE.Group {
  const grp = new THREE.Group();
  const m = new THREE.Mesh(getPropGeometry(kind), [MAT.solid, MAT.glow]);
  grp.add(m);
  if (kind === 'billboard') {
    if (!billboardFaceGeo) billboardFaceGeo = new THREE.PlaneGeometry(4.4, 2.2);
    const face = new THREE.Mesh(billboardFaceGeo, getAssets().signMats[index % getAssets().signMats.length]);
    face.position.set(0, 4.45, 0.13);
    face.name = 'face';
    grp.add(face);
  }
  grp.visible = false;
  return grp;
}

export function disposeProps(): void {
  geos.forEach((g) => g.dispose());
  geos.clear();
  billboardFaceGeo?.dispose();
  billboardFaceGeo = null;
}
