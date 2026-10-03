import * as THREE from 'three';
import { LANE_X, MAGNET_RANGE, PLAYER_HW } from '../game/constants';
import type { PowerKind } from '../game/types';
import { Builder } from './builder';
import { getAssets } from './materials';

const MAX_COINS = 300;
const MAX_POWER = 4;

export interface CollectHandlers {
  onCoin(x: number, y: number, relZ: number): void;
  onPower(kind: PowerKind, x: number, y: number, relZ: number): void;
  onMiss(): void;
}

export interface PlayerProbe {
  dist: number;
  prevDist: number;
  x: number;
  y: number;
  h: number;
  magnet: boolean;
  speed: number;
}

interface PowerItem {
  kind: PowerKind;
  obj: THREE.Group;
  active: boolean;
  s: number;
  x: number;
  y: number;
}

const _o = new THREE.Object3D();

/** Energy cells (two instanced meshes: core + glow halo) and pooled power-up pickups. */
export class Collectibles {
  readonly group = new THREE.Group();
  private cs = new Float32Array(MAX_COINS);
  private cx = new Float32Array(MAX_COINS);
  private cy = new Float32Array(MAX_COINS);
  private cg = new Int32Array(MAX_COINS);
  private alive = new Uint8Array(MAX_COINS);
  private dirty = new Uint8Array(MAX_COINS);
  private groupHit = new Uint8Array(1024);
  private nextGroup = 1;
  private core: THREE.InstancedMesh;
  private halo: THREE.InstancedMesh;
  private geos: THREE.BufferGeometry[] = [];
  private mats: THREE.Material[] = [];
  private powers: PowerItem[] = [];
  private cursor = 0;

  constructor() {
    const b = new Builder();
    b.cyl(0.3, 0.3, 0.1, 0, 0, 0, '#8dff3a', { rx: Math.PI / 2 }, 6);
    b.cyl(0.19, 0.19, 0.14, 0, 0, 0, '#f6ffc0', { rx: Math.PI / 2 }, 6);
    b.box(0.08, 0.26, 0.16, 0, 0, 0, '#1d6b2a', { glow: true });
    const coreGeo = b.flat();
    const coreMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
    const haloGeo = new THREE.PlaneGeometry(1.5, 1.5);
    const haloMat = new THREE.MeshBasicMaterial({
      map: getAssets().glowTex,
      color: '#9dff4a',
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.geos.push(coreGeo, haloGeo);
    this.mats.push(coreMat, haloMat);
    this.core = new THREE.InstancedMesh(coreGeo, coreMat, MAX_COINS);
    this.halo = new THREE.InstancedMesh(haloGeo, haloMat, MAX_COINS);
    for (const m of [this.core, this.halo]) {
      m.frustumCulled = false;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    }
    this.halo.renderOrder = 4;
    this.group.add(this.core, this.halo);
    _o.scale.setScalar(0);
    _o.updateMatrix();
    for (let i = 0; i < MAX_COINS; i++) {
      this.core.setMatrixAt(i, _o.matrix);
      this.halo.setMatrixAt(i, _o.matrix);
    }
    this.buildPowerItems();
  }

  private buildPowerItems(): void {
    const A = getAssets();
    const specs: { kind: PowerKind; color: string; make: () => Builder }[] = [
      {
        kind: 'magnet',
        color: '#ff4f7a',
        make: () => {
          const b = new Builder();
          b.custom(new THREE.TorusGeometry(0.3, 0.11, 8, 14, Math.PI), '#ff3d5a', 0, -0.05, 0, { rz: 0 });
          b.box(0.22, 0.2, 0.22, -0.3, -0.18, 0, '#f2f4fa');
          b.box(0.22, 0.2, 0.22, 0.3, -0.18, 0, '#f2f4fa');
          b.box(0.22, 0.06, 0.23, -0.3, -0.3, 0, '#ffe680', { glow: true });
          b.box(0.22, 0.06, 0.23, 0.3, -0.3, 0, '#7ffcff', { glow: true });
          return b;
        },
      },
      {
        kind: 'shield',
        color: '#4ad8ff',
        make: () => {
          const b = new Builder();
          b.custom(new THREE.IcosahedronGeometry(0.34, 0), '#3fd0ff', 0, 0, 0, { glow: true });
          b.custom(new THREE.TorusGeometry(0.44, 0.04, 6, 16), '#ffffff', 0, 0, 0, { glow: true });
          b.custom(new THREE.TorusGeometry(0.44, 0.04, 6, 16), '#ffffff', 0, 0, 0, { glow: true, ry: Math.PI / 2 });
          return b;
        },
      },
      {
        kind: 'overdrive',
        color: '#ffa020',
        make: () => {
          const b = new Builder();
          const s = new THREE.Shape();
          s.moveTo(0.1, 0.42);
          s.lineTo(-0.22, -0.02);
          s.lineTo(-0.02, -0.02);
          s.lineTo(-0.12, -0.42);
          s.lineTo(0.24, 0.08);
          s.lineTo(0.03, 0.08);
          s.closePath();
          b.custom(new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: false }), '#ffd23f', 0, 0, -0.07, { glow: true });
          return b;
        },
      },
    ];
    const badgeGeo = new THREE.SphereGeometry(0.72, 14, 10);
    const ringGeo = new THREE.TorusGeometry(0.72, 0.03, 6, 24);
    this.geos.push(badgeGeo, ringGeo);
    for (const spec of specs) {
      const geo = spec.make().flat();
      this.geos.push(geo);
      const iconMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
      const badgeMat = new THREE.MeshBasicMaterial({ color: spec.color, transparent: true, opacity: 0.28, depthWrite: false, blending: THREE.AdditiveBlending });
      const haloMat = new THREE.SpriteMaterial({ map: A.glowTex, color: spec.color, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending });
      this.mats.push(iconMat, badgeMat, haloMat);
      for (let n = 0; n < MAX_POWER / 2; n++) {
        const obj = new THREE.Group();
        const icon = new THREE.Mesh(geo, iconMat);
        icon.scale.setScalar(1.25);
        icon.name = 'icon';
        const badge = new THREE.Mesh(badgeGeo, badgeMat);
        const ring = new THREE.Mesh(ringGeo, badgeMat);
        ring.name = 'ring';
        const halo = new THREE.Sprite(haloMat);
        halo.scale.setScalar(3.4);
        obj.add(icon, badge, ring, halo);
        obj.visible = false;
        this.group.add(obj);
        this.powers.push({ kind: spec.kind, obj, active: false, s: 0, x: 0, y: 1 });
      }
    }
  }

  reset(): void {
    this.alive.fill(0);
    this.dirty.fill(1);
    this.groupHit.fill(0);
    this.powers.forEach((p) => {
      p.active = false;
      p.obj.visible = false;
    });
  }

  newGroup(): number {
    const g = this.nextGroup++;
    this.groupHit[g & 1023] = 0;
    return g;
  }

  addCoin(s: number, lane: number | null, y: number, group: number, xOverride?: number): boolean {
    for (let n = 0; n < MAX_COINS; n++) {
      const i = (this.cursor + n) % MAX_COINS;
      if (!this.alive[i]) {
        this.cursor = (i + 1) % MAX_COINS;
        this.alive[i] = 1;
        this.cs[i] = s;
        this.cx[i] = xOverride ?? LANE_X[lane ?? 1];
        this.cy[i] = y;
        this.cg[i] = group;
        return true;
      }
    }
    return false;
  }

  addPower(kind: PowerKind, s: number, x: number, y = 1.05): void {
    const p = this.powers.find((q) => q.kind === kind && !q.active);
    if (!p) return;
    p.active = true;
    p.s = s;
    p.x = x;
    p.y = y;
    p.obj.visible = true;
  }

  update(dt: number, time: number, pl: PlayerProbe, h: CollectHandlers): void {
    const spin = time * 3.4;
    const cy0 = pl.y;
    const cy1 = pl.y + pl.h;
    for (let i = 0; i < MAX_COINS; i++) {
      if (!this.alive[i]) {
        if (this.dirty[i]) {
          _o.position.set(0, 0, 0);
          _o.scale.setScalar(0);
          _o.rotation.set(0, 0, 0);
          _o.updateMatrix();
          this.core.setMatrixAt(i, _o.matrix);
          this.halo.setMatrixAt(i, _o.matrix);
          this.dirty[i] = 0;
        }
        continue;
      }
      let s = this.cs[i];
      let x = this.cx[i];
      let y = this.cy[i];
      const ahead = s - pl.dist;
      if (pl.magnet && ahead < MAGNET_RANGE && ahead > -1.2) {
        const k = Math.min(1, dt * 12);
        s += (pl.dist - s) * k + 0;
        x += (pl.x - x) * k;
        y += (pl.y + 0.9 - y) * k;
        this.cs[i] = s;
        this.cx[i] = x;
        this.cy[i] = y;
      }
      const collect = s >= pl.prevDist - 0.7 && s <= pl.dist + 0.8 && Math.abs(x - pl.x) < PLAYER_HW + 0.5 && y > cy0 - 0.35 && y < cy1 + 0.3;
      if (collect) {
        this.alive[i] = 0;
        this.dirty[i] = 1;
        this.groupHit[this.cg[i] & 1023] = 1;
        h.onCoin(x, y, -(s - pl.dist));
        continue;
      }
      if (s < pl.dist - 1.2) {
        this.alive[i] = 0;
        this.dirty[i] = 1;
        if (this.groupHit[this.cg[i] & 1023]) {
          h.onMiss();
          this.groupHit[this.cg[i] & 1023] = 0;
        }
        continue;
      }
      _o.position.set(x, y, -s);
      _o.rotation.set(0, spin + i * 0.7, 0);
      _o.scale.setScalar(1);
      _o.updateMatrix();
      this.core.setMatrixAt(i, _o.matrix);
      _o.rotation.set(0, 0, 0);
      _o.scale.setScalar(0.9 + Math.sin(time * 5 + i) * 0.12);
      _o.updateMatrix();
      this.halo.setMatrixAt(i, _o.matrix);
    }
    this.core.instanceMatrix.needsUpdate = true;
    this.halo.instanceMatrix.needsUpdate = true;

    for (const p of this.powers) {
      if (!p.active) continue;
      if (p.s < pl.dist - 6) {
        p.active = false;
        p.obj.visible = false;
        continue;
      }
      const bob = Math.sin(time * 3 + p.s) * 0.12;
      p.obj.position.set(p.x, p.y + bob, -p.s);
      const icon = p.obj.getObjectByName('icon');
      const ring = p.obj.getObjectByName('ring');
      if (icon) icon.rotation.y = time * 2.4;
      if (ring) ring.rotation.set(time * 1.5, time * 1.1, 0);
      const hit = p.s >= pl.prevDist - 1.0 && p.s <= pl.dist + 1.1 && Math.abs(p.x - pl.x) < 1.0 && p.y > cy0 - 0.5 && p.y < cy1 + 0.6;
      if (hit) {
        p.active = false;
        p.obj.visible = false;
        h.onPower(p.kind, p.x, p.y, -(p.s - pl.dist));
      }
    }
  }

  dispose(): void {
    this.geos.forEach((g) => g.dispose());
    this.mats.forEach((m) => m.dispose());
    this.core.dispose();
    this.halo.dispose();
    this.group.clear();
  }
}


