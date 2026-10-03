import type * as THREE from 'three';

export type Phase = 'loading' | 'menu' | 'playing' | 'paused' | 'dying' | 'gameover';
export type ObstacleKind = 'ac' | 'sign' | 'tank' | 'robot' | 'gap' | 'drone';
export type PowerKind = 'magnet' | 'shield' | 'overdrive';
export type Action = 'left' | 'right' | 'jump' | 'slide' | 'pause' | 'confirm';
export type ToastKind = 'info' | 'milestone' | 'power' | 'warn';

export interface Obstacle {
  kind: ObstacleKind;
  obj: THREE.Object3D;
  active: boolean;
  /** track position (centre for boxes; ramp start for gaps) */
  s: number;
  x: number;
  baseX: number;
  amp: number;
  freq: number;
  phase: number;
  halfX: number;
  halfZ: number;
  yMin: number;
  yMax: number;
  variant: number;
  /** extra animated child (brush, rotors) */
  spin?: THREE.Object3D;
  /** total track length occupied (for despawn) */
  length: number;
}

export interface SpawnSpec {
  kind: ObstacleKind;
  lane: number;
  laneB?: number;
}

export interface ToastMsg {
  id: number;
  text: string;
  kind: ToastKind;
}
