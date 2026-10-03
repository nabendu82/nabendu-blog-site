import * as THREE from 'three';
import { GAP_LEN, LANE_X, RAMP_H, RAMP_LEN } from '../game/constants';
import { rand } from '../game/rng';
import type { Obstacle, ObstacleKind } from '../game/types';
import { Builder, wedgeGeometry } from './builder';
import { MAT, getAssets } from './materials';

const POOL_SIZE: Record<ObstacleKind, number> = { ac: 16, sign: 14, tank: 12, robot: 8, gap: 8, drone: 8 };

interface Made {
  obj: THREE.Object3D;
  spin?: THREE.Object3D;
  halfX: number;
  halfZ: number;
  yMin: number;
  yMax: number;
  length: number;
}

/* Obstacle "language": orange hazard = jump, magenta overhead = slide, big teal tank = dodge,
   yellow robots / purple drones = sweeping hazards, red-lit void = gap (use the ramp). */

export class Obstacles {
  readonly group = new THREE.Group();
  readonly active: Obstacle[] = [];
  private pools: Record<ObstacleKind, Obstacle[]> = { ac: [], sign: [], tank: [], robot: [], gap: [], drone: [] };
  private geos: THREE.BufferGeometry[] = [];

  constructor() {
    (Object.keys(POOL_SIZE) as ObstacleKind[]).forEach((kind) => {
      for (let i = 0; i < POOL_SIZE[kind]; i++) {
        const m = this.make(kind, i);
        m.obj.visible = false;
        this.group.add(m.obj);
        this.pools[kind].push({
          kind,
          obj: m.obj,
          spin: m.spin,
          active: false,
          s: 0,
          x: 0,
          baseX: 0,
          amp: 0,
          freq: 0,
          phase: 0,
          halfX: m.halfX,
          halfZ: m.halfZ,
          yMin: m.yMin,
          yMax: m.yMax,
          variant: i % 2,
          length: m.length,
        });
      }
    });
  }

  private track<T extends THREE.BufferGeometry>(g: T): T {
    this.geos.push(g);
    return g;
  }

  private meshOf(b: Builder, shadow = true): THREE.Mesh {
    const m = new THREE.Mesh(this.track(b.geometry()), [MAT.solid, MAT.glow]);
    m.castShadow = shadow;
    return m;
  }

  // Geometry is identical between pool members of a kind, so cache per kind/variant.
  private cache = new Map<string, THREE.BufferGeometry>();
  private cached(key: string, fn: () => Builder): THREE.Mesh {
    let g = this.cache.get(key);
    if (!g) {
      g = this.track(fn().geometry());
      this.cache.set(key, g);
    }
    const m = new THREE.Mesh(g, [MAT.solid, MAT.glow]);
    m.castShadow = true;
    return m;
  }

  private make(kind: ObstacleKind, i: number): Made {
    const grp = new THREE.Group();
    const A = getAssets();
    switch (kind) {
      case 'ac': {
        grp.add(
          this.cached('ac', () => {
            const b = new Builder();
            b.box(1.9, 0.15, 1.4, 0, 0.075, 0, '#3a3550');
            b.box(1.86, 0.72, 1.36, 0, 0.51, 0, '#dfe3ee');
            b.box(1.9, 0.14, 1.4, 0, 0.3, 0, '#ff8a1f');
            b.box(1.96, 0.09, 1.46, 0, 0.92, 0, '#aeb6ca');
            for (const fx of [-0.5, 0.5]) {
              b.cyl(0.36, 0.36, 0.06, fx, 0.6, 0.7, '#252c48', { rx: Math.PI / 2 }, 12);
              b.box(0.55, 0.05, 0.03, fx, 0.6, 0.74, '#7ffcff', { glow: true });
              b.box(0.05, 0.55, 0.03, fx, 0.6, 0.74, '#7ffcff', { glow: true });
            }
            for (let k = 0; k < 6; k++) b.box(0.3, 0.03, 1.5, -0.82 + k * 0.33, 0.985, 0, k % 2 ? '#20223a' : '#ff8a1f');
            b.sphere(0.06, 0.8, 0.45, 0.72, '#b6ff3c', { glow: true }, 5);
            return b;
          })
        );
        return { obj: grp, halfX: 1.0, halfZ: 0.72, yMin: 0, yMax: 1.0, length: 2 };
      }
      case 'sign': {
        if (i % 2 === 0) {
          grp.add(
            this.cached('sign0', () => {
              const b = new Builder();
              for (const px of [-1.1, 1.1]) b.box(0.14, 2.8, 0.14, px, 1.4, 0, '#3a3550');
              b.box(2.5, 0.12, 0.3, 0, 2.55, 0, '#3a3550');
              b.box(2.36, 1.1, 0.14, 0, 1.95, 0, '#1a1030');
              for (const [w, h, x, y] of [[2.4, 0.07, 0, 2.52], [2.4, 0.07, 0, 1.4], [0.07, 1.12, -1.2, 1.96], [0.07, 1.12, 1.2, 1.96]] as number[][])
                b.box(w, h, 0.18, x, y, 0, '#ff3d8b', { glow: true });
              return b;
            })
          );
          const face = new THREE.Mesh(this.faceGeo(), A.duckSignMat);
          face.position.set(0, 1.96, 0.09);
          grp.add(face);
        } else {
          grp.add(
            this.cached('sign1', () => {
              const b = new Builder();
              for (const px of [-1.1, 1.1]) b.box(0.14, 2.6, 0.14, px, 1.3, 0, '#3a3550');
              for (const [y, c] of [[1.5, '#c9704a'], [1.85, '#8fa0b8'], [2.2, '#c9704a']] as [number, string][]) {
                b.cyl(0.17, 0.17, 2.4, 0, y, 0, c, { rz: Math.PI / 2 }, 8);
                for (let k = -2; k <= 2; k++) b.cyl(0.19, 0.19, 0.12, k * 0.42, y, 0, '#ffd23f', { rz: Math.PI / 2 }, 8);
              }
              b.box(2.4, 0.1, 0.1, 0, 2.5, 0, '#ff3d8b', { glow: true });
              b.box(2.4, 0.1, 0.1, 0, 1.28, 0.18, '#ff3d8b', { glow: true });
              return b;
            })
          );
        }
        return { obj: grp, halfX: 1.15, halfZ: 0.35, yMin: 1.3, yMax: 2.7, length: 1 };
      }
      case 'tank': {
        grp.add(
          this.cached('tank', () => {
            const b = new Builder();
            b.box(2.0, 0.55, 2.0, 0, 0.275, 0, '#4a4560');
            for (let k = 0; k < 4; k++) b.box(0.5, 0.56, 2.02, -0.75 + k * 0.5, 0.28, 0, k % 2 ? '#f4f0ff' : '#e0243a');
            b.cyl(0.95, 0.95, 2.6, 0, 1.85, 0, '#2aa4bb', undefined, 14);
            for (const y of [1.2, 2.1, 2.8]) b.cyl(0.99, 0.99, 0.14, 0, y, 0, '#ff8a1f', undefined, 14);
            b.cyl(0, 1.0, 0.7, 0, 3.5, 0, '#3a3550', undefined, 14);
            b.sphere(0.13, 0, 3.95, 0, '#ff3d3d', { glow: true });
            b.box(0.1, 3.4, 0.08, 0.85, 1.7, 0.6, '#2c2840');
            for (let k = 0; k < 8; k++) b.box(0.42, 0.05, 0.05, 0.85, 0.7 + k * 0.4, 0.6, '#2c2840');
            b.box(1.2, 0.5, 0.05, 0, 1.6, 0.95, '#fff2c4', { glow: true });
            b.box(1.05, 0.34, 0.06, 0, 1.6, 0.96, '#1a1030', { glow: false });
            return b;
          })
        );
        return { obj: grp, halfX: 0.98, halfZ: 0.98, yMin: 0, yMax: 4, length: 2 };
      }
      case 'robot': {
        grp.add(
          this.cached('robot', () => {
            const b = new Builder();
            b.box(1.45, 0.2, 1.3, 0, 0.3, 0, '#2a2540');
            b.box(1.3, 0.5, 1.16, 0, 0.62, 0, '#ffd23f');
            b.box(1.34, 0.12, 1.2, 0, 0.5, 0, '#20223a');
            b.sphere(0.42, 0, 0.93, 0, '#ffe680', { sy: 0.6 }, 8);
            b.box(0.8, 0.1, 0.05, 0, 0.68, 0.59, '#b6ff3c', { glow: true });
            b.cyl(0.03, 0.03, 0.45, -0.4, 1.2, -0.3, '#3a3550', undefined, 5);
            b.sphere(0.07, -0.4, 1.45, -0.3, '#ff3d3d', { glow: true }, 5);
            for (const [wx, wz] of [[-0.6, -0.42], [0.6, -0.42], [-0.6, 0.42], [0.6, 0.42]]) b.cyl(0.17, 0.17, 0.14, wx, 0.17, wz, '#151527', { rz: Math.PI / 2 }, 8);
            return b;
          })
        );
        const spin = this.cached('brush', () => {
          const b = new Builder();
          b.cyl(0.4, 0.4, 0.05, 0, 0, 0, '#ff8a1f', undefined, 10);
          for (let k = 0; k < 4; k++) b.box(0.9, 0.05, 0.12, 0, 0.04, 0, '#ff3d8b', { ry: (k * Math.PI) / 4 });
          return b;
        });
        spin.position.set(0, 1.12, 0.1);
        grp.add(spin);
        return { obj: grp, spin, halfX: 0.75, halfZ: 0.68, yMin: 0, yMax: 1.05, length: 2 };
      }
      case 'drone': {
        grp.add(
          this.cached('drone', () => {
            const b = new Builder();
            b.box(1.3, 0.34, 0.9, 0, 2.0, 0, '#6a3df0');
            b.box(1.1, 0.12, 0.7, 0, 2.2, 0, '#8a63ff');
            b.sphere(0.12, 0, 2.0, 0.47, '#ff3d8b', { glow: true }, 6);
            for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
              b.box(0.5, 0.06, 0.06, sx * 0.85, 2.12, sz * 0.32, '#3a3550', { ry: sx * sz * 0.5 });
              b.cyl(0.06, 0.06, 0.16, sx * 1.02, 2.14, sz * 0.5, '#20223a', undefined, 6);
            }
            for (const px of [-0.75, 0.75]) b.cyl(0.02, 0.02, 0.7, px, 1.6, 0.05, '#c8d4ea', undefined, 4);
            b.box(1.8, 0.5, 0.06, 0, 1.5, 0.05, '#ff3d8b', { glow: true });
            b.box(1.5, 0.3, 0.07, 0, 1.5, 0.06, '#2b0e3a');
            for (let k = -2; k <= 2; k++) b.box(0.1, 0.2, 0.09, k * 0.3, 1.5, 0.07, '#ffd0ef', { glow: true });
            return b;
          })
        );
        const rotors = this.cached('rotors', () => {
          const b = new Builder();
          for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(0.42, 0.42, 0.02, sx * 1.02, 2.24, sz * 0.5, '#8ff8ff', undefined, 14);
          return b;
        });
        rotors.material = MAT.rotor;
        rotors.castShadow = false;
        grp.add(rotors);
        return { obj: grp, halfX: 0.95, halfZ: 0.55, yMin: 1.28, yMax: 2.4, length: 2 };
      }
      case 'gap': {
        const total = RAMP_LEN + GAP_LEN;
        grp.add(
          this.cached('gap', () => {
            const b = new Builder();
            // jagged broken edges
            for (let k = 0; k < 7; k++) {
              const x = -1.05 + k * 0.35;
              b.box(0.32, 0.12, 0.35, x, 0.05, -RAMP_LEN - 0.1 - (k % 3) * 0.08, '#6b6480', { ry: k * 0.5 });
              b.box(0.3, 0.14, 0.32, x + 0.1, 0.06, -total + 0.1 + (k % 2) * 0.1, '#6b6480', { ry: k * 0.9 });
            }
            for (const ex of [-1.22, 1.22]) b.box(0.08, 0.05, GAP_LEN, ex, 0.05, -RAMP_LEN - GAP_LEN / 2, '#ff3d3d', { glow: true });
            b.box(2.5, 0.05, 0.08, 0, 0.05, -RAMP_LEN, '#ff3d3d', { glow: true });
            b.box(2.5, 0.05, 0.08, 0, 0.05, -total, '#ff3d3d', { glow: true });
            // rebar
            for (let k = 0; k < 4; k++) b.cyl(0.02, 0.02, 0.8, -0.9 + k * 0.6, 0.35, -total + 0.1, '#8a4a3a', { rx: 0.4 }, 4);
            // warning cones by the ramp
            for (const cx of [-1.3, 1.3]) {
              b.cyl(0.0, 0.16, 0.5, cx, 0.25, -0.4, '#ff8a1f', undefined, 6);
              b.cyl(0.11, 0.13, 0.09, cx, 0.3, -0.4, '#ffffff', undefined, 6);
            }
            return b;
          })
        );
        const rampGeo = this.track(wedgeGeometry(2.1, RAMP_H, RAMP_LEN));
        const rb = new Builder();
        rb.custom(rampGeo.clone(), '#ffb020', 0, 0.02, 0);
        const slope = Math.atan2(RAMP_H, RAMP_LEN);
        for (let k = 0; k < 4; k++) {
          const t = (k + 0.5) / 4;
          rb.box(1.9, 0.035, 0.32, 0, RAMP_H * t + 0.05, -RAMP_LEN * t, k % 2 ? '#20223a' : '#fff2c4', { rx: slope, glow: k % 2 === 0 });
        }
        const rampMesh = this.meshOf(rb);
        grp.add(rampMesh);
        const voidGeo = this.track(new THREE.PlaneGeometry(2.5, GAP_LEN));
        voidGeo.rotateX(-Math.PI / 2);
        const voidMesh = new THREE.Mesh(voidGeo, MAT.void);
        voidMesh.position.set(0, 0.03, -RAMP_LEN - GAP_LEN / 2);
        grp.add(voidMesh);
        return { obj: grp, halfX: 1.25, halfZ: 0, yMin: 0, yMax: 0, length: total };
      }
    }
  }

  private _face: THREE.PlaneGeometry | null = null;
  private faceGeo(): THREE.PlaneGeometry {
    if (!this._face) this._face = this.track(new THREE.PlaneGeometry(2.2, 1.04));
    return this._face;
  }

  /** Activates a pooled obstacle. Returns null when the pool is exhausted (spawn is simply skipped). */
  spawn(kind: ObstacleKind, lane: number, laneB: number | undefined, s: number): Obstacle | null {
    const o = this.pools[kind].find((p) => !p.active);
    if (!o) return null;
    o.active = true;
    o.obj.visible = true;
    o.s = s;
    o.baseX = LANE_X[lane];
    o.amp = 0;
    o.phase = rand(0, Math.PI * 2);
    if (laneB !== undefined && (kind === 'robot' || kind === 'drone')) {
      o.baseX = (LANE_X[lane] + LANE_X[laneB]) / 2;
      o.amp = Math.abs(LANE_X[laneB] - LANE_X[lane]) / 2;
      o.freq = (kind === 'robot' ? 1.9 : 2.5) / Math.max(0.5, o.amp);
      o.phase = Math.random() < 0.5 ? 0 : Math.PI;
    }
    o.x = o.baseX + Math.sin(o.phase) * o.amp;
    if (kind === 'gap') o.halfZ = 0;
    o.obj.position.set(o.x, 0, -s);
    o.obj.rotation.set(0, 0, 0);
    return o;
  }

  release(o: Obstacle): void {
    o.active = false;
    o.obj.visible = false;
    const i = this.active.indexOf(o);
    if (i >= 0) this.active.splice(i, 1);
  }

  /** Rebuilds the active list and animates sweeping obstacles. */
  update(dt: number, dist: number, time: number): void {
    this.active.length = 0;
    for (const kind of Object.keys(this.pools) as ObstacleKind[]) {
      for (const o of this.pools[kind]) {
        if (!o.active) continue;
        if (o.s + o.length < dist - 14) {
          o.active = false;
          o.obj.visible = false;
          continue;
        }
        this.active.push(o);
        if (o.amp > 0) {
          const prev = o.x;
          o.x = o.baseX + Math.sin(time * o.freq + o.phase) * o.amp;
          o.obj.position.x = o.x;
          if (o.kind === 'robot') {
            const vx = (o.x - prev) / Math.max(dt, 1e-4);
            o.obj.rotation.y += (Math.atan2(-vx, 4) * 0.8 - o.obj.rotation.y) * Math.min(1, dt * 8);
            o.obj.rotation.z = -vx * 0.02;
          } else if (o.kind === 'drone') {
            o.obj.position.y = Math.sin(time * 3 + o.phase) * 0.08;
            o.obj.rotation.z = -((o.x - prev) / Math.max(dt, 1e-4)) * 0.04;
          }
        }
        if (o.spin) o.spin.rotation.y += dt * 9;
      }
    }
  }

  releaseAll(): void {
    for (const kind of Object.keys(this.pools) as ObstacleKind[]) {
      for (const o of this.pools[kind]) {
        o.active = false;
        o.obj.visible = false;
      }
    }
    this.active.length = 0;
  }

  dispose(): void {
    this.geos.forEach((g) => g.dispose());
    this.group.clear();
  }
}
