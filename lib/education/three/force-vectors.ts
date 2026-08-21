import * as THREE from "three";

export type ForceVectorSpec = {
  id: string;
  label: string;
  origin: THREE.Vector3;
  direction: THREE.Vector3;
  magnitude: number;
  color: number;
};

const SCALE = 0.012;
const MIN_LEN = 0.28;
const MAX_LEN = 1.35;

/**
 * Dynamic force arrows — shaft + cone, rebuilt each update from physics state.
 */
export class ForceVectorLayer {
  readonly root = new THREE.Group();
  private arrows = new Map<
    string,
    {
      group: THREE.Group;
      shaft: THREE.Mesh;
      head: THREE.Mesh;
      label: string;
    }
  >();
  private visible = true;

  constructor() {
    this.root.name = "force-vectors";
  }

  setVisible(visible: boolean) {
    this.visible = visible;
    this.root.visible = visible;
  }

  sync(specs: ForceVectorSpec[]) {
    const seen = new Set<string>();
    for (const spec of specs) {
      seen.add(spec.id);
      let entry = this.arrows.get(spec.id);
      if (!entry) {
        entry = this.createArrow(spec.color);
        entry.label = spec.label;
        this.arrows.set(spec.id, entry);
        this.root.add(entry.group);
      }
      this.layout(entry, spec);
    }
    for (const [id, entry] of Array.from(this.arrows.entries())) {
      if (seen.has(id)) continue;
      this.root.remove(entry.group);
      entry.shaft.geometry.dispose();
      (entry.shaft.material as THREE.Material).dispose();
      entry.head.geometry.dispose();
      (entry.head.material as THREE.Material).dispose();
      this.arrows.delete(id);
    }
    this.root.visible = this.visible;
  }

  clear() {
    for (const [, entry] of Array.from(this.arrows.entries())) {
      this.root.remove(entry.group);
      entry.shaft.geometry.dispose();
      (entry.shaft.material as THREE.Material).dispose();
      entry.head.geometry.dispose();
      (entry.head.material as THREE.Material).dispose();
    }
    this.arrows.clear();
  }

  dispose() {
    this.clear();
  }

  private createArrow(color: number) {
    const group = new THREE.Group();
    const shaftMat = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.2,
      roughness: 0.45,
      emissive: color,
      emissiveIntensity: 0.15,
    });
    const headMat = shaftMat.clone();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 1, 10), shaftMat);
    shaft.geometry.translate(0, 0.5, 0);
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.16, 12), headMat);
    head.geometry.translate(0, 0.08, 0);
    group.add(shaft, head);
    return { group, shaft, head, label: "" };
  }

  private layout(
    entry: { group: THREE.Group; shaft: THREE.Mesh; head: THREE.Mesh },
    spec: ForceVectorSpec,
  ) {
    const dir = spec.direction.clone();
    if (dir.lengthSq() < 1e-8) {
      entry.group.visible = false;
      return;
    }
    dir.normalize();
    const len = THREE.MathUtils.clamp(spec.magnitude * SCALE, MIN_LEN, MAX_LEN);
    entry.group.visible = true;
    entry.group.position.copy(spec.origin);

    const quat = new THREE.Quaternion();
    quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    entry.group.quaternion.copy(quat);

    entry.shaft.scale.set(1, Math.max(0.05, len - 0.16), 1);
    entry.head.position.y = Math.max(0.05, len - 0.16);

    const mat = entry.shaft.material as THREE.MeshStandardMaterial;
    mat.color.setHex(spec.color);
    mat.emissive.setHex(spec.color);
    const headMat = entry.head.material as THREE.MeshStandardMaterial;
    headMat.color.setHex(spec.color);
    headMat.emissive.setHex(spec.color);
  }
}
