import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MAT } from './materials';

export interface PartOpts {
  glow?: boolean;
  rx?: number;
  ry?: number;
  rz?: number;
  sx?: number;
  sy?: number;
  sz?: number;
}

const _e = new THREE.Euler();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _c = new THREE.Color();

/**
 * Collects primitive parts (with vertex colours) and merges them into one geometry so an entire
 * prop / obstacle costs a single draw call. Parts flagged `glow` go to an unlit material group.
 */
export class Builder {
  private solid: THREE.BufferGeometry[] = [];
  private glow: THREE.BufferGeometry[] = [];

  custom(g: THREE.BufferGeometry, color: string | number, x = 0, y = 0, z = 0, o: PartOpts = {}): this {
    const geo = g.index ? g.toNonIndexed() : g.clone();
    geo.deleteAttribute('uv');
    if (!geo.getAttribute('normal')) geo.computeVertexNormals();
    _e.set(o.rx ?? 0, o.ry ?? 0, o.rz ?? 0);
    _q.setFromEuler(_e);
    _p.set(x, y, z);
    _s.set(o.sx ?? 1, o.sy ?? 1, o.sz ?? 1);
    _m.compose(_p, _q, _s);
    geo.applyMatrix4(_m);
    _c.set(color);
    const n = geo.getAttribute('position').count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = _c.r;
      arr[i * 3 + 1] = _c.g;
      arr[i * 3 + 2] = _c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    (o.glow ? this.glow : this.solid).push(geo);
    g.dispose();
    return this;
  }

  box(w: number, h: number, d: number, x: number, y: number, z: number, color: string | number, o?: PartOpts): this {
    return this.custom(new THREE.BoxGeometry(w, h, d), color, x, y, z, o);
  }
  cyl(rt: number, rb: number, h: number, x: number, y: number, z: number, color: string | number, o?: PartOpts, seg = 10): this {
    return this.custom(new THREE.CylinderGeometry(rt, rb, h, seg), color, x, y, z, o);
  }
  sphere(r: number, x: number, y: number, z: number, color: string | number, o?: PartOpts, seg = 8): this {
    return this.custom(new THREE.SphereGeometry(r, seg, Math.max(4, seg - 2)), color, x, y, z, o);
  }

  /** Geometry with group 0 = lit solid parts, group 1 = unlit glow parts (groups always present). */
  geometry(): THREE.BufferGeometry {
    const solid = this.solid.length ? mergeGeometries(this.solid, false) : null;
    const glow = this.glow.length ? mergeGeometries(this.glow, false) : null;
    if (solid && glow) return mergeGeometries([solid, glow], true);
    const only = (solid ?? glow)!;
    only.addGroup(0, only.getAttribute('position').count, solid ? 0 : 1);
    return only;
  }

  /** All parts merged into a single group (for use with one material). */
  flat(): THREE.BufferGeometry {
    return mergeGeometries([...this.solid, ...this.glow], false);
  }

  mesh(shadow = false): THREE.Mesh {
    const m = new THREE.Mesh(this.geometry(), [MAT.solid, MAT.glow]);
    m.castShadow = shadow;
    return m;
  }

  dispose(): void {
    this.solid = [];
    this.glow = [];
  }
}

/** Right-triangle prism ramp: low at z=0, rising to h at z=-l. */
export function wedgeGeometry(w: number, h: number, l: number): THREE.BufferGeometry {
  const a = w / 2;
  const v: number[] = [];
  const tri = (...p: number[]) => v.push(...p);
  // slope
  tri(-a, 0, 0, a, 0, 0, a, h, -l);
  tri(-a, 0, 0, a, h, -l, -a, h, -l);
  // back
  tri(a, 0, -l, -a, 0, -l, -a, h, -l);
  tri(a, 0, -l, -a, h, -l, a, h, -l);
  // sides
  tri(a, 0, 0, a, 0, -l, a, h, -l);
  tri(-a, 0, 0, -a, h, -l, -a, 0, -l);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(v), 3));
  g.computeVertexNormals();
  return g;
}
