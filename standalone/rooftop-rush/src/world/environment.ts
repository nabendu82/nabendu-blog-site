import * as THREE from 'three';
import { PALETTE } from '../game/constants';
import { rand, pick } from '../game/rng';
import { Builder } from './builder';
import { MAT, getAssets } from './materials';

const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const SKY_FRAG = /* glsl */ `
varying vec3 vDir;
uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHor; uniform vec3 uSunDir;
void main(){
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col = mix(uHor, uMid, smoothstep(0.0, 0.22, h));
  col = mix(col, uTop, smoothstep(0.18, 0.75, h));
  col = mix(col, uHor * 0.8, smoothstep(0.0, -0.25, h));
  float sd = max(dot(d, uSunDir), 0.0);
  col += vec3(1.0, 0.62, 0.32) * pow(sd, 6.0) * 0.35;
  col += vec3(1.0, 0.75, 0.45) * pow(sd, 48.0) * 0.6;
  col = mix(col, vec3(1.0, 0.95, 0.8), smoothstep(0.9986, 0.9993, sd));
  gl_FragColor = vec4(col, 1.0);
}`;

const L_MID = 420;
const L_FAR = 560;

interface Layer {
  copies: THREE.Group[];
  factor: number;
  length: number;
}

interface DroneFx {
  obj: THREE.Group;
  own: number;
  swayA: number;
  swayF: number;
  baseX: number;
}

/** Sky, sun, clouds, parallax skyline, temples, distant drones and lighting. */
export class Environment {
  readonly group = new THREE.Group();
  readonly sun: THREE.DirectionalLight;
  private skyMat: THREE.ShaderMaterial;
  private sky: THREE.Mesh;
  private sunSprite: THREE.Sprite;
  private clouds: THREE.Mesh[] = [];
  private layers: Layer[] = [];
  private drones: DroneFx[] = [];
  private geos: THREE.BufferGeometry[] = [];
  private mats: THREE.Material[] = [];
  private time = 0;

  constructor() {
    const A = getAssets();

    // ---- lights
    const hemi = new THREE.HemisphereLight('#ffc9a0', '#4a3070', 1.05);
    const key = new THREE.DirectionalLight('#ffd2a0', 2.1);
    key.position.set(7, 14, 9);
    key.target.position.set(0, 0, -8);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    const sc = key.shadow.camera;
    sc.left = -12;
    sc.right = 12;
    sc.top = 24;
    sc.bottom = -24;
    sc.near = 1;
    sc.far = 45;
    key.shadow.bias = -0.0006;
    key.shadow.normalBias = 0.03;
    this.sun = key;
    const rim = new THREE.DirectionalLight('#ff8f60', 1.3);
    rim.position.set(-4, 5, -20);
    this.group.add(hemi, key, key.target, rim);

    // ---- sky
    const sunDir = new THREE.Vector3(-0.18, 0.13, -1).normalize();
    this.skyMat = new THREE.ShaderMaterial({
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uTop: { value: new THREE.Color('#2b2466') },
        uMid: { value: new THREE.Color('#d9578a') },
        uHor: { value: new THREE.Color(PALETTE.fog) },
        uSunDir: { value: sunDir },
      },
    });
    const skyGeo = new THREE.SphereGeometry(520, 24, 16);
    this.geos.push(skyGeo);
    this.mats.push(this.skyMat);
    this.sky = new THREE.Mesh(skyGeo, this.skyMat);
    this.sky.renderOrder = -10;
    this.sky.frustumCulled = false;
    this.group.add(this.sky);

    const sunMat = new THREE.SpriteMaterial({ map: A.glowTex, color: '#ffb46a', transparent: true, opacity: 0.85, depthWrite: false, fog: false, blending: THREE.AdditiveBlending });
    this.mats.push(sunMat);
    this.sunSprite = new THREE.Sprite(sunMat);
    this.sunSprite.position.copy(sunDir).multiplyScalar(480);
    this.sunSprite.scale.setScalar(300);
    this.sunSprite.renderOrder = -9;
    this.group.add(this.sunSprite);

    // abyss floor so alleys never show the void
    const gGeo = new THREE.PlaneGeometry(1600, 1600);
    gGeo.rotateX(-Math.PI / 2);
    const gMat = new THREE.MeshBasicMaterial({ color: '#4a2a58' });
    this.geos.push(gGeo);
    this.mats.push(gMat);
    const ground = new THREE.Mesh(gGeo, gMat);
    ground.position.y = -70;
    this.group.add(ground);

    this.buildClouds();
    this.buildSkyline();
    this.buildDrones();
  }

  private buildClouds(): void {
    const variants: [string, string][] = [['#ffb6a0', '#ff9a8a'], ['#ffd8a8', '#ffb98a'], ['#9c86b8', '#7a689c']];
    const geos = variants.map(([top, bot]) => {
      const b = new Builder();
      const n = 5 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const x = (i - n / 2) * 5 + rand(-1.5, 1.5);
        const r = rand(4, 7);
        b.custom(new THREE.IcosahedronGeometry(r, 1), i % 2 ? top : bot, x, rand(-1, 2), rand(-3, 3), { sy: 0.5 });
      }
      const g = b.flat();
      this.geos.push(g);
      return g;
    });
    const mats = variants.map(() => {
      const m = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.92, depthWrite: false });
      this.mats.push(m);
      return m;
    });
    for (let i = 0; i < 18; i++) {
      const v = i % 5 === 0 ? 2 : i % 2;
      const c = new THREE.Mesh(geos[v], mats[v]);
      c.position.set(rand(-260, 260), rand(50, 110), rand(-400, 30));
      if (Math.abs(c.position.x) < 30) c.position.x += Math.sign(c.position.x || 1) * 60;
      c.scale.setScalar(rand(1.2, 2.4));
      c.userData.drift = rand(1.2, 3);
      this.clouds.push(c);
      this.group.add(c);
    }
  }

  private skylineInstances(count: number, xMin: number, xMax: number, hMin: number, hMax: number, L: number, mat: THREE.Material, palette: string[]): THREE.InstancedMesh {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    this.geos.push(geo);
    const im = new THREE.InstancedMesh(geo, mat, count);
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const side = i % 2 ? 1 : -1;
      const w = rand(9, 20);
      const d = rand(9, 20);
      const h = rand(hMin, hMax);
      const x = side * rand(xMin, xMax);
      const z = -((i / count) * L + rand(0, L / count));
      o.position.set(x, (h - 60) / 2, z);
      o.scale.set(w, h + 60, d);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
      c.set(pick(palette)).multiplyScalar(rand(0.85, 1.1));
      im.setColorAt(i, c);
    }
    im.frustumCulled = false;
    return im;
  }

  private temple(): THREE.BufferGeometry {
    const b = new Builder();
    b.box(9, 1.2, 9, 0, 0.6, 0, '#e8b48a');
    b.box(7, 1.0, 7, 0, 1.7, 0, '#f0c090');
    let y = 2.2;
    let w = 5.4;
    for (let i = 0; i < 7; i++) {
      b.box(w, 1.6, w, 0, y + 0.8, 0, i % 2 ? '#f2a27a' : '#e58a6c');
      b.box(w + 0.5, 0.25, w + 0.5, 0, y + 1.7, 0, '#ffd08a', { glow: i % 2 === 0 });
      y += 1.85;
      w *= 0.84;
    }
    b.sphere(1.0, 0, y + 0.6, 0, '#f5c07a', { sy: 0.6 });
    b.cyl(0.08, 0.28, 2.0, 0, y + 1.8, 0, '#ffd23f', undefined, 6);
    b.sphere(0.22, 0, y + 2.9, 0, '#ffe680', { glow: true }, 6);
    for (const dx of [-3.4, 3.4]) {
      b.box(1.6, 2.6, 1.6, dx, 2.5, 3.2, '#e8a07a');
      b.cyl(0.0, 1.0, 1.2, dx, 4.4, 3.2, '#f2a27a', undefined, 4);
    }
    b.box(1.4, 1.5, 0.08, 0, 1.4, 4.55, '#ffb020', { glow: true });
    const g = b.geometry();
    this.geos.push(g);
    return g;
  }

  private tower(): THREE.BufferGeometry {
    const b = new Builder();
    b.cyl(3.2, 4.5, 40, 0, 20, 0, '#5b4a86', undefined, 8);
    b.cyl(2.0, 3.2, 26, 0, 53, 0, '#7a5fb0', undefined, 8);
    for (let i = 0; i < 6; i++) b.cyl(3.7 - i * 0.15, 3.7 - i * 0.15, 0.5, 0, 8 + i * 6, 0, i % 2 ? '#ff3d8b' : '#3df0d0', { glow: true }, 8);
    b.cyl(0.15, 0.4, 24, 0, 78, 0, '#c8d4ea', undefined, 5);
    b.sphere(0.6, 0, 90.5, 0, '#ff5a7a', { glow: true }, 6);
    const g = b.geometry();
    this.geos.push(g);
    return g;
  }

  private buildSkyline(): void {
    const A = getAssets();
    const midPalette = ['#b06a8c', '#8a6fb8', '#c98a7a', '#6f7fc0', '#d8a06a', '#9a5f8f'];
    const farPalette = ['#a06898', '#8f78b8', '#b87f92', '#8a8ac8', '#c08a88'];
    const temple = this.temple();
    const tower = this.tower();
    const defs: { L: number; factor: number; make: () => THREE.Group }[] = [
      {
        L: L_MID,
        factor: 1.0,
        make: () => {
          const g = new THREE.Group();
          g.add(this.skylineInstances(70, 34, 80, 24, 70, L_MID, A.skylineMat, midPalette));
          return g;
        },
      },
      {
        L: L_FAR,
        factor: 0.62,
        make: () => {
          const g = new THREE.Group();
          g.add(this.skylineInstances(90, 95, 230, 50, 160, L_FAR, A.farSkylineMat, farPalette));
          for (let i = 0; i < 4; i++) {
            const t = new THREE.Mesh(temple, [MAT.solid, MAT.glow]);
            t.scale.setScalar(rand(2.2, 3.6));
            t.position.set((i % 2 ? 1 : -1) * rand(70, 140), 0, -((i + 0.5) / 4) * L_FAR);
            t.position.y = 0;
            t.rotation.y = (t.position.x > 0 ? 1 : -1) * 0.5;
            g.add(t);
          }
          for (let i = 0; i < 4; i++) {
            const t = new THREE.Mesh(tower, [MAT.solid, MAT.glow]);
            t.scale.setScalar(rand(1.0, 1.5));
            t.position.set((i % 2 ? -1 : 1) * rand(110, 200), -30, -((i + 0.2) / 4) * L_FAR);
            g.add(t);
          }
          return g;
        },
      },
    ];
    for (const d of defs) {
      const first = d.make();
      // second copy reuses the same layout (clone shares geometry/materials)
      const copies = [first, first.clone()];
      copies.forEach((c) => this.group.add(c));
      this.layers.push({ copies, factor: d.factor, length: d.L });
    }
  }

  private buildDrones(): void {
    const b = new Builder();
    b.box(0.9, 0.3, 0.9, 0, 0, 0, '#f2f4fa');
    b.box(0.7, 0.12, 0.7, 0, 0.18, 0, '#ff8a1f');
    b.box(0.4, 0.4, 0.4, 0, -0.35, 0, '#c98a5a');
    b.box(0.42, 0.06, 0.42, 0, -0.3, 0, '#ffe0a0');
    b.sphere(0.07, 0, 0.0, 0.46, '#ff3d3d', { glow: true }, 5);
    b.sphere(0.06, 0, 0.0, -0.46, '#7ffcff', { glow: true }, 5);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      b.box(0.8, 0.05, 0.05, sx * 0.55, 0.14, sz * 0.4, '#3a3550', { ry: sx * sz * 0.6 });
    }
    const geo = b.geometry();
    const rb = new Builder();
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) rb.cyl(0.42, 0.42, 0.02, sx * 0.85, 0.2, sz * 0.62, '#ffffff');
    const rGeo = rb.flat();
    this.geos.push(geo, rGeo);
    for (let i = 0; i < 9; i++) {
      const obj = new THREE.Group();
      obj.add(new THREE.Mesh(geo, [MAT.solid, MAT.glow]), new THREE.Mesh(rGeo, MAT.rotor));
      obj.scale.setScalar(rand(1.6, 2.6));
      this.group.add(obj);
      const d: DroneFx = { obj, own: rand(6, 12), swayA: rand(1, 4), swayF: rand(0.3, 0.9), baseX: 0 };
      this.respawnDrone(d, rand(-380, 0));
      this.drones.push(d);
    }
  }

  private respawnDrone(d: DroneFx, z: number): void {
    d.baseX = (Math.random() < 0.5 ? -1 : 1) * rand(9, 46);
    d.obj.position.set(d.baseX, rand(7, 26), z);
    d.own = rand(6, 12);
  }

  update(dt: number, dist: number, speed: number, camX: number, camY: number, camZ: number): void {
    this.time += dt;
    this.sky.position.set(camX, camY, camZ);
    this.sunSprite.position.set(camX - 86, camY + 62, camZ - 470);
    for (const l of this.layers) {
      const r = (dist * l.factor) % l.length;
      l.copies[0].position.z = 60 + r;
      l.copies[1].position.z = 60 + r - l.length;
    }
    for (const c of this.clouds) {
      c.position.z += (speed * 0.05 + c.userData.drift) * dt;
      if (c.position.z > 60) {
        c.position.z = -420;
        c.position.x = rand(-260, 260);
        if (Math.abs(c.position.x) < 30) c.position.x += Math.sign(c.position.x || 1) * 60;
      }
    }
    for (const d of this.drones) {
      d.obj.position.z += Math.max(1, speed * 0.92 - d.own) * dt;
      d.obj.position.x = d.baseX + Math.sin(this.time * d.swayF + d.baseX) * d.swayA;
      d.obj.position.y += Math.sin(this.time * 2 + d.baseX) * 0.01;
      d.obj.rotation.z = Math.sin(this.time * d.swayF + d.baseX) * 0.12;
      if (d.obj.position.z > 40) this.respawnDrone(d, -rand(300, 380));
    }
  }

  dispose(): void {
    this.geos.forEach((g) => g.dispose());
    this.mats.forEach((m) => m.dispose());
    this.layers.forEach((l) => l.copies.forEach((c) => c.traverse((o) => { if ((o as THREE.InstancedMesh).isInstancedMesh) (o as THREE.InstancedMesh).dispose(); })));
    this.group.clear();
  }
}
