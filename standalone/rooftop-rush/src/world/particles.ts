import * as THREE from 'three';
import { rand } from '../game/rng';

const VERT = /* glsl */ `
attribute float size;
attribute float alpha;
attribute vec3 pcolor;
uniform float uScale;
varying float vAlpha;
varying vec3 vColor;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = max(0.0, size * uScale / -mv.z);
  gl_Position = projectionMatrix * mv;
  vAlpha = alpha;
  vColor = pcolor;
}`;
const FRAG = /* glsl */ `
varying float vAlpha;
varying vec3 vColor;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.05, d) * vAlpha;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor, a);
}`;

const _c = new THREE.Color();

/** Fixed-size particle pool rendered as one Points draw call. */
export class ParticleSystem {
  readonly points: THREE.Points;
  private geo = new THREE.BufferGeometry();
  private mat: THREE.ShaderMaterial;
  private pos: Float32Array;
  private vel: Float32Array;
  private col: Float32Array;
  private size: Float32Array;
  private alpha: Float32Array;
  private age: Float32Array;
  private life: Float32Array;
  private size0: Float32Array;
  private grow: Float32Array;
  private head = 0;

  constructor(private max: number, additive: boolean, private gravity = 0, private drag = 1.5) {
    this.pos = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    this.size = new Float32Array(max);
    this.alpha = new Float32Array(max);
    this.age = new Float32Array(max).fill(1);
    this.life = new Float32Array(max).fill(1);
    this.size0 = new Float32Array(max);
    this.grow = new Float32Array(max);
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('pcolor', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('size', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: { uScale: { value: 400 } },
    });
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
  }

  setScale(v: number): void {
    this.mat.uniforms.uScale.value = v;
  }

  emit(x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, size: number, color: THREE.ColorRepresentation, grow = 0): void {
    const i = this.head;
    this.head = (this.head + 1) % this.max;
    this.pos[i * 3] = x;
    this.pos[i * 3 + 1] = y;
    this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx;
    this.vel[i * 3 + 1] = vy;
    this.vel[i * 3 + 2] = vz;
    _c.set(color);
    this.col[i * 3] = _c.r;
    this.col[i * 3 + 1] = _c.g;
    this.col[i * 3 + 2] = _c.b;
    this.age[i] = 0;
    this.life[i] = life;
    this.size0[i] = size;
    this.grow[i] = grow;
  }

  burst(x: number, y: number, z: number, count: number, speed: number, color: THREE.ColorRepresentation, size = 0.3, life = 0.6): void {
    for (let k = 0; k < count; k++) {
      const a = rand(0, Math.PI * 2);
      const e = rand(-0.4, 1);
      const sp = speed * rand(0.4, 1);
      this.emit(x, y, z, Math.cos(a) * sp * (1 - Math.abs(e) * 0.3), e * sp + speed * 0.2, Math.sin(a) * sp, life * rand(0.6, 1.2), size * rand(0.6, 1.3), color, -0.4);
    }
  }

  /** `scroll` moves every particle towards the camera at world speed so they stay fixed in the world. */
  update(dt: number, scroll: number): void {
    const dragK = Math.exp(-this.drag * dt);
    for (let i = 0; i < this.max; i++) {
      const age = this.age[i] + dt;
      if (age >= this.life[i]) {
        if (this.alpha[i] !== 0) {
          this.alpha[i] = 0;
          this.size[i] = 0;
        }
        this.age[i] = this.life[i];
        continue;
      }
      this.age[i] = age;
      const i3 = i * 3;
      this.vel[i3] *= dragK;
      this.vel[i3 + 1] = this.vel[i3 + 1] * dragK - this.gravity * dt;
      this.vel[i3 + 2] *= dragK;
      this.pos[i3] += this.vel[i3] * dt;
      this.pos[i3 + 1] += this.vel[i3 + 1] * dt;
      this.pos[i3 + 2] += this.vel[i3 + 2] * dt + scroll;
      const t = age / this.life[i];
      this.alpha[i] = (1 - t) * (1 - t * 0.3);
      this.size[i] = Math.max(0, this.size0[i] * (1 + this.grow[i] * t));
    }
    (this.geo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.geo.getAttribute('pcolor') as THREE.BufferAttribute).needsUpdate = true;
    (this.geo.getAttribute('size') as THREE.BufferAttribute).needsUpdate = true;
    (this.geo.getAttribute('alpha') as THREE.BufferAttribute).needsUpdate = true;
  }

  clear(): void {
    this.age.fill(1);
    this.alpha.fill(0);
    this.size.fill(0);
  }

  dispose(): void {
    this.geo.dispose();
    this.mat.dispose();
  }
}
