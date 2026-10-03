import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { JUMP_VELOCITY } from '../game/constants';
import { clamp, damp } from '../game/rng';
import { G } from '../game/state';
import { getAssets } from './materials';

const L1 = 0.34; // thigh
const L2 = 0.34; // shin
const FOOT = 0.09;

// pose vector indices
const LT = 0, LK = 1, RT = 2, RK = 3, LA = 4, LE = 5, RA = 6, RE = 7, TX = 8, HX = 9, PX = 10, HIP = 11, SPL = 12;
const N = 13;

const SHIELD_VERT = /* glsl */ `
varying vec3 vN; varying vec3 vV;
void main(){
  vec4 mv = modelViewMatrix * vec4(position,1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const SHIELD_FRAG = /* glsl */ `
uniform float uTime; uniform float uPop; uniform vec3 uColor;
varying vec3 vN; varying vec3 vV;
void main(){
  float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
  float hex = 0.5 + 0.5 * sin(vN.y * 14.0 + uTime * 3.0) * sin(vN.x * 14.0 - uTime * 2.0);
  float a = (f * 0.9 + 0.08 + hex * 0.06) * (1.0 - uPop);
  gl_FragColor = vec4(uColor, a);
}`;

/** Original courier robot built from primitives, animated through a skeletal-style node hierarchy. */
export class Player {
  readonly group = new THREE.Group();
  modelSettled = false;
  private disposed = false;
  private root = new THREE.Group();
  private pose = new THREE.Group();
  private torso = new THREE.Group();
  private head = new THREE.Group();
  private pack = new THREE.Group();
  private antenna = new THREE.Group();
  private legs: { thigh: THREE.Group; shin: THREE.Group }[] = [];
  private arms: { shoulder: THREE.Group; elbow: THREE.Group }[] = [];
  private blob: THREE.Mesh;
  private shield: THREE.Mesh;
  private shieldMat: THREE.ShaderMaterial;
  private magnetRing: THREE.Mesh;
  private trail: THREE.Group;
  private aura: THREE.Mesh;
  private flashMats: THREE.MeshStandardMaterial[] = [];
  private eyeMat: THREE.MeshBasicMaterial;
  private geos: THREE.BufferGeometry[] = [];
  private mats: THREE.Material[] = [];
  private phi = 0;
  private wAir = 0;
  private wSlide = 0;
  private wDead = 0;
  private cur = new Float32Array(N);
  private a = new Float32Array(N);
  private b = new Float32Array(N);
  private c = new Float32Array(N);
  private time = 0;

  constructor() {
    const cyan = this.std('#19c9e6', 0.35, 0.35, true);
    const cyanDark = this.std('#0f8fb0', 0.4, 0.3, true);
    const orange = this.std('#ff8a1f', 0.45, 0.2, true);
    const dark = this.std('#1c2540', 0.5, 0.4);
    const white = this.std('#eef8ff', 0.4, 0.2, true);
    const steel = this.std('#8b98b5', 0.35, 0.6);
    this.eyeMat = new THREE.MeshBasicMaterial({ color: '#7ffcff', toneMapped: false });
    const glowOrange = new THREE.MeshBasicMaterial({ color: '#ffb060', toneMapped: false });
    this.mats.push(this.eyeMat, glowOrange);

    const mk = (geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0, parent: THREE.Object3D = this.torso): THREE.Mesh => {
      this.geos.push(geo);
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      parent.add(m);
      return m;
    };
    const capsule = (r: number, l: number) => new THREE.CapsuleGeometry(r, l, 4, 8);
    const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);

    this.group.add(this.root);
    this.root.scale.setScalar(0.9);
    this.root.add(this.pose);
    this.pose.add(this.torso);

    // ----- torso (origin at hips, +y up, robot faces -z)
    mk(box(0.62, 0.54, 0.4), cyan, 0, 0.36, 0);
    mk(box(0.5, 0.2, 0.42), orange, 0, 0.1, 0); // belt
    mk(box(0.34, 0.26, 0.05), dark, 0, 0.42, -0.22); // chest panel
    mk(new THREE.CircleGeometry(0.07, 10), new THREE.MeshBasicMaterial({ color: '#ffb060', toneMapped: false }), 0, 0.42, -0.25).castShadow = false;
    mk(box(0.66, 0.1, 0.44), cyanDark, 0, 0.66, 0); // collar
    mk(capsule(0.06, 0.1), steel, 0, 0.72, 0);
    // delivery pack (back = +z)
    this.torso.add(this.pack);
    this.pack.position.set(0, 0.38, 0.32);
    mk(box(0.5, 0.52, 0.28), orange, 0, 0, 0.05, this.pack);
    mk(box(0.42, 0.12, 0.3), white, 0, 0.14, 0.05, this.pack);
    mk(box(0.46, 0.08, 0.02), cyan, 0, -0.08, 0.2, this.pack);
    mk(new THREE.CircleGeometry(0.09, 10), glowOrange, 0, 0.14, 0.205, this.pack).castShadow = false;
    mk(box(0.06, 0.2, 0.06), dark, -0.16, -0.32, 0.05, this.pack);
    mk(box(0.06, 0.2, 0.06), dark, 0.16, -0.32, 0.05, this.pack);
    mk(new THREE.SphereGeometry(0.05, 6, 5), glowOrange, -0.16, -0.44, 0.05, this.pack).castShadow = false;
    mk(new THREE.SphereGeometry(0.05, 6, 5), glowOrange, 0.16, -0.44, 0.05, this.pack).castShadow = false;
    this.pack.add(this.antenna);
    this.antenna.position.set(0.18, 0.26, 0.05);
    mk(new THREE.CylinderGeometry(0.015, 0.015, 0.36, 5), steel, 0, 0.18, 0, this.antenna);
    mk(new THREE.SphereGeometry(0.05, 6, 5), glowOrange, 0, 0.38, 0, this.antenna).castShadow = false;

    // ----- head
    this.torso.add(this.head);
    this.head.position.set(0, 0.95, 0);
    const skull = new THREE.SphereGeometry(0.33, 14, 10);
    this.geos.push(skull);
    const skullMesh = new THREE.Mesh(skull, white);
    skullMesh.scale.set(1.08, 0.86, 0.98);
    skullMesh.castShadow = true;
    this.head.add(skullMesh);
    mk(box(0.5, 0.2, 0.06), dark, 0, 0.02, -0.29, this.head); // visor
    mk(capsule(0.045, 0.06), this.eyeMat, -0.12, 0.02, -0.325, this.head).castShadow = false;
    mk(capsule(0.045, 0.06), this.eyeMat, 0.12, 0.02, -0.325, this.head).castShadow = false;
    for (const sx of [-1, 1]) {
      mk(new THREE.CylinderGeometry(0.11, 0.11, 0.1, 10), orange, sx * 0.34, 0.0, 0, this.head).rotation.z = Math.PI / 2;
      mk(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 10), cyan, sx * 0.36, 0.0, 0, this.head).rotation.z = Math.PI / 2;
    }
    mk(box(0.08, 0.05, 0.4), orange, 0, 0.27, 0, this.head); // crest
    mk(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 4), steel, 0.08, 0.36, 0.05, this.head);
    mk(new THREE.SphereGeometry(0.045, 6, 5), glowOrange, 0.08, 0.48, 0.05, this.head).castShadow = false;

    // ----- arms
    for (const sx of [-1, 1]) {
      const shoulder = new THREE.Group();
      shoulder.position.set(sx * 0.4, 0.58, 0);
      this.torso.add(shoulder);
      mk(new THREE.SphereGeometry(0.11, 8, 6), orange, 0, 0, 0, shoulder);
      mk(capsule(0.065, 0.16), cyan, 0, -0.17, 0, shoulder);
      const elbow = new THREE.Group();
      elbow.position.set(0, -0.34, 0);
      shoulder.add(elbow);
      mk(new THREE.SphereGeometry(0.07, 6, 5), dark, 0, 0, 0, elbow);
      mk(capsule(0.06, 0.14), white, 0, -0.15, 0, elbow);
      mk(new THREE.SphereGeometry(0.095, 8, 6), orange, 0, -0.3, 0, elbow);
      this.arms.push({ shoulder, elbow });
    }

    // ----- legs (children of pose so slide can rotate everything about the hips)
    for (const sx of [-1, 1]) {
      const thigh = new THREE.Group();
      thigh.position.set(sx * 0.16, 0, 0);
      this.pose.add(thigh);
      mk(new THREE.SphereGeometry(0.11, 8, 6), dark, 0, 0, 0, thigh);
      mk(capsule(0.085, 0.16), cyan, 0, -0.17, 0, thigh);
      const shin = new THREE.Group();
      shin.position.set(0, -L1, 0);
      thigh.add(shin);
      mk(new THREE.SphereGeometry(0.08, 6, 5), dark, 0, 0, 0, shin);
      mk(capsule(0.07, 0.15), white, 0, -0.17, 0, shin);
      mk(box(0.2, 0.1, 0.34), orange, 0, -L2 - 0.04, -0.06, shin);
      mk(box(0.2, 0.03, 0.34), dark, 0, -L2 - 0.1, -0.06, shin);
      this.legs.push({ thigh, shin });
    }

    // ----- shadow blob (world ground)
    const blobGeo = new THREE.PlaneGeometry(1.5, 1.5);
    blobGeo.rotateX(-Math.PI / 2);
    const blobMat = new THREE.MeshBasicMaterial({ map: getAssets().blobTex, transparent: true, depthWrite: false, opacity: 0.85 });
    this.geos.push(blobGeo);
    this.mats.push(blobMat);
    this.blob = new THREE.Mesh(blobGeo, blobMat);
    this.blob.renderOrder = 2;
    this.group.add(this.blob);

    // ----- effects
    const shGeo = new THREE.SphereGeometry(1.25, 20, 14);
    this.geos.push(shGeo);
    this.shieldMat = new THREE.ShaderMaterial({
      vertexShader: SHIELD_VERT,
      fragmentShader: SHIELD_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPop: { value: 0 }, uColor: { value: new THREE.Color('#4ad8ff') } },
    });
    this.mats.push(this.shieldMat);
    this.shield = new THREE.Mesh(shGeo, this.shieldMat);
    this.shield.position.y = 0.95;
    this.shield.visible = false;
    this.shield.renderOrder = 6;
    this.root.add(this.shield);

    const ringGeo = new THREE.TorusGeometry(0.95, 0.035, 6, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: '#ff5a7a', transparent: true, opacity: 0.85, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false });
    this.geos.push(ringGeo);
    this.mats.push(ringMat);
    this.magnetRing = new THREE.Mesh(ringGeo, ringMat);
    this.magnetRing.position.y = 0.95;
    this.magnetRing.visible = false;
    this.root.add(this.magnetRing);

    this.trail = new THREE.Group();
    const coneGeo = new THREE.ConeGeometry(0.2, 5, 6, 1, true);
    coneGeo.rotateX(Math.PI / 2);
    coneGeo.translate(0, 0, 2.5);
    this.geos.push(coneGeo);
    const trailMat = new THREE.MeshBasicMaterial({ color: '#ff9a2a', transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    this.mats.push(trailMat);
    [[-0.3, 0.55], [0.3, 0.55], [0, 1.0], [-0.55, 0.9], [0.55, 0.9]].forEach(([x, y]) => {
      const c = new THREE.Mesh(coneGeo, trailMat);
      c.position.set(x, y, 0.4);
      this.trail.add(c);
    });
    this.trail.visible = false;
    this.root.add(this.trail);

    const auraGeo = new THREE.SphereGeometry(1.05, 14, 10);
    const auraMat = new THREE.MeshBasicMaterial({ color: '#ffa040', transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    this.geos.push(auraGeo);
    this.mats.push(auraMat);
    this.aura = new THREE.Mesh(auraGeo, auraMat);
    this.aura.position.y = 0.95;
    this.aura.scale.set(0.9, 1.35, 0.9);
    this.aura.visible = false;
    this.root.add(this.aura);
    this.loadCourier();
  }

  private loadCourier(): void {
    const oldMeshes: THREE.Mesh[] = [];
    this.pose.traverse(o => { if (o instanceof THREE.Mesh) oldMeshes.push(o); });
    const parts: Record<string, [THREE.Group, number, number, number]> = {
      Torso: [this.torso, 0, 0, 0], Head: [this.head, 0, .95, 0],
      Pack: [this.pack, 0, .38, .32], Antenna: [this.antenna, .18, .64, .37],
    };
    for (const [i, side] of ['L', 'R'].entries()) {
      const sign = i === 0 ? -1 : 1;
      parts['Shoulder_' + side] = [this.arms[i].shoulder, sign * .4, .58, 0];
      parts['Elbow_' + side] = [this.arms[i].elbow, sign * .4, .24, 0];
      parts['Thigh_' + side] = [this.legs[i].thigh, sign * .16, 0, 0];
      parts['Shin_' + side] = [this.legs[i].shin, sign * .16, -.34, 0];
    }
    new GLTFLoader().load(import.meta.env.BASE_URL + 'models/courier.glb', gltf => {
      gltf.scene.updateMatrixWorld(true);
      const replacements: [THREE.Group, THREE.Mesh][] = [];
      const sourceGeos = new Set<THREE.BufferGeometry>();
      const sourceMats = new Set<THREE.Material>();
      gltf.scene.traverse(o => {
        if (!(o instanceof THREE.Mesh)) return;
        sourceGeos.add(o.geometry);
        const materials = Array.isArray(o.material) ? o.material : [o.material];
        materials.forEach(m => sourceMats.add(m));
        if (this.disposed) return;
        let part: THREE.Object3D | null = o;
        while (part && !parts[part.name.replace('Courier_', '')]) part = part.parent;
        if (!part) return;
        const [parent, x, y, z] = parts[part.name.replace('Courier_', '')];
        const geometry = o.geometry.clone().applyMatrix4(o.matrixWorld).translate(-x, -y, -z);
        const cloned = materials.map(m => m.clone());
        this.geos.push(geometry);
        this.mats.push(...cloned);
        cloned.forEach(m => {
          if (m instanceof THREE.MeshStandardMaterial && m.emissive.getHex() === 0) this.flashMats.push(m);
        });
        const mesh = new THREE.Mesh(geometry, cloned.length === 1 ? cloned[0] : cloned);
        mesh.name = o.name;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        replacements.push([parent, mesh]);
      });
      if (replacements.length) {
        oldMeshes.forEach(m => m.removeFromParent());
        replacements.forEach(([parent, mesh]) => parent.add(mesh));
      }
      sourceGeos.forEach(g => g.dispose());
      sourceMats.forEach(m => m.dispose());
      this.modelSettled = true;
    }, undefined, error => {
      console.warn('Courier model unavailable; using the built-in courier.', error);
      this.modelSettled = true;
    });
  }

  private std(color: string, rough: number, metal: number, flash = false): THREE.MeshStandardMaterial {
    const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, flatShading: false, emissive: '#000000' });
    this.mats.push(m);
    if (flash) this.flashMats.push(m);
    return m;
  }

  private legFoot(a: number, k: number): number {
    return L1 * Math.cos(a) + (L2 + FOOT) * Math.cos(a + k);
  }

  private runPose(phi: number, sp: number, out: Float32Array): void {
    const sL = Math.sin(phi);
    const sR = -sL;
    out[LT] = sL * 0.98 + 0.05;
    out[LK] = -(0.25 + Math.max(0, Math.cos(phi)) * 1.35);
    out[RT] = sR * 0.98 + 0.05;
    out[RK] = -(0.25 + Math.max(0, -Math.cos(phi)) * 1.35);
    out[LA] = -sL * 0.95;
    out[LE] = 1.15 + Math.max(0, Math.cos(phi + Math.PI)) * 0.25;
    out[RA] = sL * 0.95;
    out[RE] = 1.15 + Math.max(0, Math.cos(phi)) * 0.25;
    out[TX] = -0.16 - sp * 0.14;
    out[HX] = 0.12 + sp * 0.06;
    out[PX] = 0;
    out[HIP] = Math.max(this.legFoot(out[LT], out[LK]), this.legFoot(out[RT], out[RK]));
    out[SPL] = 0.0;
  }

  private airPose(out: Float32Array): void {
    const t = clamp(G.vy / JUMP_VELOCITY, -1, 1);
    const flip = G.jumpParity ? -1 : 1;
    const front = 0.85 - 0.25 * t;
    const back = -0.5 - 0.2 * t;
    out[LT] = flip > 0 ? front : back;
    out[LK] = flip > 0 ? -0.45 - 0.3 * t : -1.25;
    out[RT] = flip > 0 ? back : front;
    out[RK] = flip > 0 ? -1.25 : -0.45 - 0.3 * t;
    out[LA] = 2.5 - 0.4 * (1 - t);
    out[LE] = 0.35;
    out[RA] = 2.5 - 0.4 * (1 - t);
    out[RE] = 0.35;
    out[TX] = -0.1;
    out[HX] = 0.05;
    out[PX] = 0;
    out[HIP] = 0.78;
    out[SPL] = 0.45;
  }

  private slidePose(out: Float32Array): void {
    out[LT] = 0.08;
    out[LK] = -0.05;
    out[RT] = -0.02;
    out[RK] = -0.1;
    out[LA] = 0.35;
    out[LE] = 0.5;
    out[RA] = 0.65;
    out[RE] = 0.4;
    out[TX] = 0.0;
    out[HX] = -1.0;
    out[PX] = 1.3;
    out[HIP] = 0.3;
    out[SPL] = 0.15;
  }

  private deadPose(out: Float32Array): void {
    out[LT] = 0.4;
    out[LK] = -0.3;
    out[RT] = -0.1;
    out[RK] = -0.6;
    out[LA] = 2.2;
    out[LE] = 0.3;
    out[RA] = 1.6;
    out[RE] = 0.1;
    out[TX] = 0.1;
    out[HX] = 0.5;
    out[PX] = 1.5;
    out[HIP] = 0.38;
    out[SPL] = 0.7;
  }

  /** Reset transient animation state (new run / return to menu). */
  reset(): void {
    this.wAir = 0;
    this.wSlide = 0;
    this.wDead = 0;
    this.phi = 0;
  }

  update(dt: number, ground: number, running: boolean): void {
    this.time += dt;
    const dying = G.phase === 'dying';
    const sp = clamp(G.speed / 34, 0, 1);

    if (running && !dying) this.phi += dt * (14 + G.speed * 0.28);
    const tAir = G.grounded ? 0 : 1;
    this.wAir += (tAir - this.wAir) * damp(18, dt);
    this.wSlide += ((G.sliding && G.grounded ? 1 : 0) - this.wSlide) * damp(22, dt);
    this.wDead += ((dying ? 1 : 0) - this.wDead) * damp(dying ? 9 : 30, dt);

    this.runPose(this.phi, sp, this.a);
    this.airPose(this.b);
    this.slidePose(this.c);
    const cur = this.cur;
    for (let i = 0; i < N; i++) {
      let v = this.a[i] + (this.b[i] - this.a[i]) * this.wAir;
      v += (this.c[i] - v) * this.wSlide;
      cur[i] = v;
    }
    this.deadPose(this.b);
    for (let i = 0; i < N; i++) cur[i] += (this.b[i] - cur[i]) * this.wDead;

    // landing crouch + hit stagger
    const land = G.landT > 0 ? G.landT / 0.18 : 0;
    const hit = G.hitT > 0 ? Math.sin((G.hitT / 0.5) * Math.PI) : 0;
    cur[HIP] -= land * 0.13;
    cur[TX] -= land * 0.25;
    cur[LK] -= land * 0.5;
    cur[RK] -= land * 0.5;
    cur[LT] += land * 0.3;
    cur[RT] += land * 0.3;
    cur[PX] += hit * 0.35;
    cur[HX] += hit * 0.5 * Math.sin(this.time * 60);

    this.legs[0].thigh.rotation.x = cur[LT];
    this.legs[0].shin.rotation.x = cur[LK];
    this.legs[1].thigh.rotation.x = cur[RT];
    this.legs[1].shin.rotation.x = cur[RK];
    this.arms[0].shoulder.rotation.x = cur[LA];
    this.arms[0].elbow.rotation.x = cur[LE];
    this.arms[1].shoulder.rotation.x = cur[RA];
    this.arms[1].elbow.rotation.x = cur[RE];
    this.arms[0].shoulder.rotation.z = -0.12 - cur[SPL] * 0.9;
    this.arms[1].shoulder.rotation.z = 0.12 + cur[SPL] * 0.9;
    this.torso.rotation.x = cur[TX];
    this.torso.rotation.y = Math.sin(this.phi) * 0.14 * (1 - this.wAir) * (1 - this.wSlide);
    this.head.rotation.x = cur[HX];
    this.head.rotation.y = -Math.sin(this.phi) * 0.06;
    this.pose.rotation.x = cur[PX];
    this.pose.position.y = cur[HIP];
    this.pack.rotation.x = Math.sin(this.phi * 2) * 0.05 * (1 - this.wAir);
    this.antenna.rotation.z = Math.sin(this.time * 9) * 0.15 + (G.x - G.targetX) * 0.2;
    this.antenna.rotation.x = 0.2 + sp * 0.35;

    // root placement, lane lean/yaw
    const dx = G.targetX - G.x;
    const lean = clamp(-dx * 0.2, -0.38, 0.38);
    const bump = G.bumpT > 0 ? Math.sin(G.bumpT * 40) * G.bumpT * 0.9 * G.bumpDir : 0;
    this.root.position.set(G.x + bump * 0.1, G.y, 0);
    this.root.rotation.z += (lean - this.root.rotation.z) * damp(16, dt);
    this.root.rotation.y += (clamp(-dx * 0.12, -0.3, 0.3) - this.root.rotation.y) * damp(16, dt);

    // hit flash
    const flash = clamp(G.hitT / 0.5, 0, 1) * (Math.sin(this.time * 70) > 0 ? 1 : 0.35);
    const inv = G.invulnT > 0 && G.phase === 'playing' && G.overT <= 0 && !G.shield;
    const blink = inv ? (Math.sin(this.time * 40) > 0 ? 0.5 : 0) : 0;
    for (const m of this.flashMats) {
      m.emissive.setRGB(flash * 1 + blink * 0.4, flash * 0.25 + blink * 0.4, flash * 0.2 + blink * 0.45);
    }

    // shadow blob
    const height = Math.max(0, G.y - ground);
    const s = 1 / (1 + height * 0.45);
    this.blob.position.set(G.x, ground + 0.04, 0);
    this.blob.scale.setScalar(s * (G.sliding ? 1.25 : 1));
    (this.blob.material as THREE.MeshBasicMaterial).opacity = G.y < -0.3 ? 0 : 0.8 * s;

    // effects
    const shieldOn = G.shield || G.shieldPopT > 0;
    this.shield.visible = shieldOn;
    if (shieldOn) {
      this.shieldMat.uniforms.uTime.value = this.time;
      this.shieldMat.uniforms.uPop.value = G.shield ? 0 : 1 - G.shieldPopT / 0.35;
      const pulse = 1 + Math.sin(this.time * 6) * 0.03 + (G.shield ? 0 : (1 - G.shieldPopT / 0.35) * 0.5);
      this.shield.scale.setScalar(pulse * (G.sliding ? 0.85 : 1));
      this.shield.position.y = G.sliding ? 0.6 : 0.95;
    }
    this.magnetRing.visible = G.magnetT > 0;
    if (G.magnetT > 0) {
      this.magnetRing.rotation.set(Math.PI / 2 + Math.sin(this.time * 3) * 0.3, this.time * 3, 0);
      const s2 = 1 + (0.5 + 0.5 * Math.sin(this.time * 5)) * 0.25;
      this.magnetRing.scale.setScalar(s2);
      this.magnetRing.position.y = G.sliding ? 0.6 : 0.95;
      (this.magnetRing.material as THREE.MeshBasicMaterial).opacity = G.magnetT < 1.5 ? (Math.sin(this.time * 30) > 0 ? 0.9 : 0.2) : 0.85;
    }
    const od = G.overT > 0;
    this.trail.visible = od;
    this.aura.visible = od;
    if (od) {
      const f = 0.8 + Math.sin(this.time * 40) * 0.2;
      this.trail.scale.set(1, 1, f * (1 + sp * 0.4));
      this.aura.position.y = G.sliding ? 0.6 : 0.95;
      this.aura.scale.set(0.9 * f, 1.35 * f, 0.9 * f);
    }
  }

  /** Foot position in scene space for particle emitters. */
  get x(): number {
    return G.x;
  }

  dispose(): void {
    this.disposed = true;
    this.geos.forEach((g) => g.dispose());
    this.mats.forEach((m) => m.dispose());
    this.group.clear();
  }
}
