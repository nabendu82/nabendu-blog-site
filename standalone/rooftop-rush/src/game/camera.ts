import * as THREE from 'three';
import { damp } from './rng';
import { G } from './state';

const pos = new THREE.Vector3(0, 4.2, 8.4);
const look = new THREE.Vector3(0, 1.3, -14);
const tPos = new THREE.Vector3();
const tLook = new THREE.Vector3();
let fov = 58;
let inited = false;

/** Third-person follow camera with lane-follow smoothing, speed FOV, shake, and a menu showcase shot. */
export function updateCamera(dt: number, cam: THREE.PerspectiveCamera): void {
  const menu = G.phase === 'menu' || G.phase === 'loading';
  const aspect = cam.aspect || 1.6;
  let tFov: number;
  let rate: number;
  if (menu) {
    tPos.set(4.3, 1.5, -2.4);
    tLook.set(0.1, 1.15, aspect < 0.9 ? 0.6 : 1.9);
    tFov = aspect < 0.9 ? 52 : 40;
    rate = 3;
  } else {
    const k = Math.max(1, Math.min(2.2, 0.85 / aspect));
    tPos.set(G.x * 0.62, 4.2 + (k - 1) * 3.4 + G.y * 0.3, 8.4 + (k - 1) * 9);
    tLook.set(G.x * 0.42, 1.35, -14);
    const sp = Math.min(1, G.speed / 34);
    tFov = 58 + sp * 14 + (G.overT > 0 ? 8 : 0);
    rate = G.time < 1.4 ? 3.2 : 7;
  }
  if (!inited) {
    pos.copy(tPos);
    look.copy(tLook);
    fov = tFov;
    inited = true;
  }
  const k = damp(rate, dt);
  pos.lerp(tPos, k);
  look.lerp(tLook, k);
  fov += (tFov - fov) * damp(4, dt);
  cam.position.copy(pos);
  if (G.shake > 0.001) {
    cam.position.x += (Math.random() - 0.5) * G.shake * 0.7;
    cam.position.y += (Math.random() - 0.5) * G.shake * 0.5;
  }
  cam.lookAt(look);
  if (Math.abs(cam.fov - fov) > 0.01) {
    cam.fov = fov;
    cam.updateProjectionMatrix();
  }
}
