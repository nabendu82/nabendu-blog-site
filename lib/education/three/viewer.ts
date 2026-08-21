import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import gsap from "gsap";
import { ForceVectorLayer } from "@/lib/education/three/force-vectors";
import { createAssembly, type AssemblyParams, type HudState, type MachineAssembly } from "@/lib/education/three/assemblies";
import { sound } from "@/lib/education/audio";
import { loadGLTFModel } from "@/lib/education/three/gltf-loader";
import { machineById } from "@/lib/education/machines-data";

export type HotspotScreenPos = {
  id: string;
  x: number;
  y: number;
  visible: boolean;
};

export type ViewerCallbacks = {
  onHud: (hud: HudState) => void;
  onReady?: () => void;
  onHotspotsScreen?: (positions: HotspotScreenPos[]) => void;
};

export class MachineViewer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  private controls: OrbitControls;
  private vectors = new ForceVectorLayer();
  private assembly: MachineAssembly | null = null;
  private customGLTF: THREE.Group | null = null;
  private callbacks: ViewerCallbacks;
  private container: HTMLElement;
  private currentMachineId: string = "inclined-plane";

  private frame = 0;
  private lastTick = 0;
  private hudAccumulator = 0;
  private resizeObserver: ResizeObserver;
  private intersectionObserver: IntersectionObserver;
  private dirty = true;
  private busyUntil = 0;
  private disposed = false;
  private isVisible = true;
  private isPageVisible = true;
  private basePixelRatio: number;
  private autoRotateWanted = false;
  private vectorsOn = true;
  private isolated = false;

  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private grabbing: THREE.Object3D | null = null;
  private lastPointer = { x: 0, y: 0 };
  private pointerId: number | null = null;

  constructor(container: HTMLElement, callbacks: ViewerCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    const lowPower =
      window.matchMedia("(max-width: 780px)").matches || (navigator.hardwareConcurrency ?? 8) < 6;
    this.basePixelRatio = Math.min(window.devicePixelRatio, lowPower ? 1.5 : 2);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !lowPower,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(this.basePixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.domElement.setAttribute(
      "aria-label",
      "Interactive 3D simple machine. Drag to orbit, scroll to zoom, grab handles to operate the machine.",
    );
    this.renderer.domElement.tabIndex = 0;
    container.appendChild(this.renderer.domElement);

    this.camera.position.set(2.5, 2, 6);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.enablePan = false;
    this.controls.minDistance = 3.2;
    this.controls.maxDistance = 10;
    this.controls.autoRotate = false;
    this.controls.autoRotateSpeed = 0.75;
    this.controls.target.set(0, 0, 0);
    this.controls.addEventListener("change", () => {
      this.dirty = true;
    });

    this.buildEnvironment();
    this.scene.add(this.vectors.root);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        this.isVisible = entry.isIntersecting;
        if (this.isVisible) this.dirty = true;
      },
      { threshold: 0.05 },
    );
    this.intersectionObserver.observe(container);

    const onVisibility = () => {
      this.isPageVisible = document.visibilityState === "visible";
      if (this.isPageVisible) this.dirty = true;
    };
    document.addEventListener("visibilitychange", onVisibility);

    this.bindPointer();
    this.resize();
    this.frame = requestAnimationFrame(() => this.loop());
    (this as unknown as { _onVisibility: () => void })._onVisibility = onVisibility;
  }

  async setMachine(id: string, params?: AssemblyParams) {
    this.currentMachineId = id;
    if (this.assembly) {
      this.scene.remove(this.assembly.root);
      this.assembly.dispose();
      this.assembly = null;
      this.vectors.clear();
    }
    if (this.customGLTF) {
      this.scene.remove(this.customGLTF);
      this.customGLTF = null;
    }

    // Try loading custom GLTF model if available in /public/models/
    const gltfModel = await loadGLTFModel(id);

    const assembly = createAssembly(id);
    this.assembly = assembly;
    if (params) assembly.setParams(params);
    assembly.setIsolated(this.isolated);

    if (gltfModel) {
      this.customGLTF = gltfModel;
      this.scene.add(gltfModel);
    } else {
      this.scene.add(assembly.root);
    }

    this.vectors.setVisible(this.vectorsOn);
    this.controls.autoRotate = this.autoRotateWanted;

    assembly.root.scale.setScalar(1);
    assembly.root.updateWorldMatrix(true, true);
    this.frameAssembly(assembly);

    assembly.root.scale.setScalar(0.85);
    gsap.to(assembly.root.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.65,
      ease: "power3.out",
      onUpdate: () => {
        this.dirty = true;
      },
    });

    sound.playClick(720, 0.05);
    this.pushHud();
    this.syncVectors();
    this.dirty = true;
    this.busy(0.9);
    this.callbacks.onReady?.();
  }

  private frameAssembly(assembly: MachineAssembly) {
    const box = new THREE.Box3().setFromObject(assembly.root);
    if (box.isEmpty()) {
      this.camera.position.set(assembly.homeCamera.x, assembly.homeCamera.y, assembly.homeCamera.z);
      this.controls.target.set(assembly.homeTarget.x, assembly.homeTarget.y, assembly.homeTarget.z);
      this.controls.update();
      return;
    }

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 1);
    const fitHeightDistance = maxDim / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) * 0.5));
    const fitWidthDistance = fitHeightDistance / Math.max(this.camera.aspect, 0.5);

    // Balanced per-machine camera framing multipliers so all assemblies fit comfortably
    const machineDistanceMultipliers: Record<string, number> = {
      "inclined-plane": 1.05,
      gears: 0.95,
      lever: 0.98,
      screw: 1.75,
      pulley: 1.35,
      "wheel-axle": 1.10,
    };
    const mult = machineDistanceMultipliers[this.currentMachineId] ?? 1.05;
    const distance = Math.max(fitHeightDistance, fitWidthDistance) * mult;

    // Shift target Y to center tall vertical assemblies without top clipping
    const targetYOffset: Record<string, number> = {
      screw: -0.25,
      pulley: 0.15,
    };
    const yOffset = targetYOffset[this.currentMachineId] ?? 0;
    const target = center.clone();
    target.y += yOffset;

    const dir = new THREE.Vector3(0.55, 0.36, 1).normalize();
    this.controls.target.copy(target);
    this.camera.position.copy(target).addScaledVector(dir, distance);
    this.controls.minDistance = distance * 0.45;
    this.controls.maxDistance = distance * 2.0;
    this.controls.update();
    this.camera.updateProjectionMatrix();
  }

  setParams(params: AssemblyParams) {
    if (!this.assembly) return;
    this.assembly.setParams(params);
    this.pushHud();
    this.syncVectors();
    this.dirty = true;
  }

  getParams(): AssemblyParams {
    return this.assembly?.getParams() ?? {};
  }

  setAutoRotate(enabled: boolean) {
    this.autoRotateWanted = enabled;
    this.controls.autoRotate = enabled && !this.grabbing;
    sound.playClick(enabled ? 800 : 400, 0.03);
    this.dirty = true;
  }

  setVectorsVisible(visible: boolean) {
    this.vectorsOn = visible;
    this.vectors.setVisible(visible);
    sound.playClick(visible ? 900 : 450, 0.03);
    this.dirty = true;
  }

  toggleIsolate() {
    this.isolated = !this.isolated;
    this.assembly?.setIsolated(this.isolated);
    sound.playClick(650, 0.03);
    this.dirty = true;
  }

  reset() {
    this.assembly?.reset();
    this.isolated = false;
    this.assembly?.setIsolated(false);
    if (this.assembly) this.frameAssembly(this.assembly);
    this.pushHud();
    this.syncVectors();
    sound.playClick(500, 0.05);
    this.dirty = true;
  }

  zoom(direction: 1 | -1) {
    const offset = this.camera.position.clone().sub(this.controls.target);
    const dist = offset.length() * (direction > 0 ? 0.85 : 1.18);
    offset.setLength(THREE.MathUtils.clamp(dist, this.controls.minDistance, this.controls.maxDistance));
    sound.playClick(direction > 0 ? 850 : 550, 0.02);
    gsap.to(this.camera.position, {
      x: this.controls.target.x + offset.x,
      y: this.controls.target.y + offset.y,
      z: this.controls.target.z + offset.z,
      duration: 0.35,
      ease: "power2.out",
      onUpdate: () => {
        this.dirty = true;
      },
    });
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    const onVisibility = (this as unknown as { _onVisibility?: () => void })._onVisibility;
    if (onVisibility) document.removeEventListener("visibilitychange", onVisibility);
    this.unbindPointer();
    if (this.assembly) {
      this.scene.remove(this.assembly.root);
      this.assembly.dispose();
    }
    if (this.customGLTF) {
      this.scene.remove(this.customGLTF);
    }
    this.vectors.dispose();
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.scene.environment?.dispose();
  }

  private buildEnvironment() {
    this.scene.background = null;
    const ambient = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xf5f8fc, 0x5a6774, 0.85);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff5e6, 1.4);
    key.position.set(3.5, 7, 4.5);
    key.castShadow = true;
    key.shadow.mapSize.width = 1024;
    key.shadow.mapSize.height = 1024;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 15;
    key.shadow.camera.left = -3;
    key.shadow.camera.right = 3;
    key.shadow.camera.top = 3;
    key.shadow.camera.bottom = -3;
    key.shadow.bias = -0.0005;
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0xb7d0ea, 0.6);
    fill.position.set(-4.5, 3, -2.5);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 0.4);
    rim.position.set(0, 2, -5);
    this.scene.add(rim);

    // Realistic Plinth Ground Floor with Shadow Receiving
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.35, 0.14, 64),
      new THREE.MeshStandardMaterial({
        color: 0xced7e0,
        roughness: 0.45,
        metalness: 0.25,
        envMapIntensity: 0.9,
      }),
    );
    plinth.position.y = -1.58;
    plinth.receiveShadow = true;
    this.scene.add(plinth);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.15, 0.02, 16, 64),
      new THREE.MeshStandardMaterial({ color: 0x8fa3b6, metalness: 0.8, roughness: 0.2 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -1.5;
    this.scene.add(ring);

    // Studio Environment Reflections using RoomEnvironment
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    this.scene.environment = pmrem.fromScene(roomEnv).texture;
    pmrem.dispose();
    roomEnv.dispose();
  }

  private bindPointer() {
    const el = this.renderer.domElement;
    el.addEventListener("pointerdown", this.onPointerDown);
    el.addEventListener("pointermove", this.onPointerMove);
    el.addEventListener("pointerup", this.onPointerUp);
    el.addEventListener("pointercancel", this.onPointerUp);
    el.addEventListener("pointerleave", this.onPointerUp);
  }

  private unbindPointer() {
    const el = this.renderer.domElement;
    el.removeEventListener("pointerdown", this.onPointerDown);
    el.removeEventListener("pointermove", this.onPointerMove);
    el.removeEventListener("pointerup", this.onPointerUp);
    el.removeEventListener("pointercancel", this.onPointerUp);
    el.removeEventListener("pointerleave", this.onPointerUp);
  }

  private onPointerDown = (event: PointerEvent) => {
    if (!this.assembly || event.button !== 0) return;
    this.updatePointer(event);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.assembly.grabTargets, true);
    if (!hits.length) return;
    let obj: THREE.Object3D | null = hits[0].object;
    while (obj && !obj.userData.grab) obj = obj.parent;
    if (!obj) obj = this.assembly.grabTargets[0];
    this.grabbing = obj;
    this.pointerId = event.pointerId;
    this.lastPointer = { x: event.clientX, y: event.clientY };
    this.controls.enabled = false;
    this.controls.autoRotate = false;
    this.assembly.onPointerDown?.(obj);

    if (this.currentMachineId === "gears") sound.playGearClick(1.2);
    else if (this.currentMachineId === "pulley") sound.playRopeHum();
    else sound.playClick(680, 0.03);

    elSetPointerCapture(this.renderer.domElement, event.pointerId);
    event.preventDefault();
  };

  private onPointerMove = (event: PointerEvent) => {
    if (!this.grabbing || !this.assembly || this.pointerId !== event.pointerId) return;
    const dx = (event.clientX - this.lastPointer.x) / Math.max(1, this.container.clientWidth);
    const dy = -(event.clientY - this.lastPointer.y) / Math.max(1, this.container.clientHeight);
    this.lastPointer = { x: event.clientX, y: event.clientY };
    if (this.assembly.onDrag(this.grabbing, dx, dy)) {
      if (Math.random() < 0.3) {
        if (this.currentMachineId === "gears") sound.playGearClick(1.0 + Math.random() * 0.4);
        else if (this.currentMachineId === "pulley") sound.playRopeHum();
      }
      this.pushHud();
      this.syncVectors();
      this.dirty = true;
    }
  };

  private onPointerUp = (event: PointerEvent) => {
    if (this.pointerId !== null && event.pointerId !== this.pointerId) return;
    this.grabbing = null;
    this.pointerId = null;
    this.controls.enabled = true;
    this.controls.autoRotate = this.autoRotateWanted;
    this.dirty = true;
  };

  private updatePointer(event: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private syncVectors() {
    if (!this.assembly) return;
    this.vectors.sync(this.assembly.getForceVectors());
  }

  private pushHud() {
    if (!this.assembly) return;
    this.callbacks.onHud(this.assembly.getHud());
  }

  private updateHotspotScreenPositions() {
    if (!this.callbacks.onHotspotsScreen || !this.assembly) return;
    const m = machineById[this.currentMachineId as keyof typeof machineById];
    if (!m || !m.hotspots) return;

    const tempVec = new THREE.Vector3();
    const positions: HotspotScreenPos[] = m.hotspots.map((h) => {
      tempVec.set(h.pos[0], h.pos[1], h.pos[2]);
      tempVec.applyMatrix4(this.assembly!.root.matrixWorld);
      tempVec.project(this.camera);

      return {
        id: h.id,
        x: ((tempVec.x + 1) / 2) * 100,
        y: ((-tempVec.y + 1) / 2) * 100,
        visible: tempVec.z < 1,
      };
    });

    this.callbacks.onHotspotsScreen(positions);
  }

  private busy(seconds: number) {
    this.busyUntil = performance.now() + seconds * 1000;
    this.dirty = true;
  }

  private resize() {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.dirty = true;
  }

  private loop = () => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.loop);
    if (!this.isVisible || !this.isPageVisible) return;

    const now = performance.now();
    const dt = this.lastTick ? Math.min(0.05, (now - this.lastTick) / 1000) : 0.016;
    this.lastTick = now;

    const demo = this.autoRotateWanted && !this.grabbing;
    let demoMoved = false;
    if (this.assembly?.tick && demo) {
      demoMoved = this.assembly.tick(dt, true) === true;
      if (demoMoved) {
        this.hudAccumulator += dt;
        if (this.hudAccumulator > 0.2) {
          this.hudAccumulator = 0;
          this.pushHud();
        }
        this.syncVectors();
        this.dirty = true;
      }
    }

    const needs =
      this.dirty ||
      this.controls.autoRotate ||
      demoMoved ||
      performance.now() < this.busyUntil ||
      this.grabbing !== null;

    if (this.controls.enabled) this.controls.update();
    this.updateHotspotScreenPositions();

    if (!needs && !this.controls.autoRotate) return;

    if (this.assembly) this.syncVectors();
    this.renderer.render(this.scene, this.camera);
    this.dirty =
      this.controls.autoRotate ||
      demo ||
      this.grabbing !== null ||
      performance.now() < this.busyUntil;
  };
}

function elSetPointerCapture(el: HTMLElement, id: number) {
  try {
    el.setPointerCapture(id);
  } catch {
    /* ignore */
  }
}
