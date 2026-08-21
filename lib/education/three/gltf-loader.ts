import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
const cache = new Map<string, THREE.Group>();

export async function loadGLTFModel(machineId: string): Promise<THREE.Group | null> {
  const url = `/models/${machineId}.glb`;
  if (cache.has(machineId)) {
    return cache.get(machineId)!.clone();
  }

  return new Promise((resolve) => {
    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        cache.set(machineId, model);
        resolve(model.clone());
      },
      undefined,
      () => {
        // Fallback gracefully if no GLB file is in /public/models/
        resolve(null);
      },
    );
  });
}
