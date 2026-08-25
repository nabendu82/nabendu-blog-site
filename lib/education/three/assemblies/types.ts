import type * as THREE from "three";
import type { ForceVectorSpec } from "@/lib/education/three/force-vectors";

export type HudState = {
  ma: number;
  effort: number;
  load: number;
  lines: { label: string; value: string }[];
};

export type AssemblyParams = Record<string, number>;

export interface MachineAssembly {
  root: THREE.Group;
  grabTargets: THREE.Object3D[];
  homeCamera: { x: number; y: number; z: number };
  homeTarget: { x: number; y: number; z: number };
  setParams(params: AssemblyParams): void;
  getParams(): AssemblyParams;
  getForceVectors(): ForceVectorSpec[];
  getHud(): HudState;
  onDrag(target: THREE.Object3D, dx: number, dy: number): boolean;
  onPointerDown?(target: THREE.Object3D): void;
  tick?(dt: number, demo: boolean): boolean;
  reset(): void;
  setIsolated(isolated: boolean): void;
  dispose(): void;
}
