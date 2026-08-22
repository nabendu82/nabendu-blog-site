import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import { playForestFootstep, startForestAudio } from "./forestAudio";

const SPEED = 6.4;
const LOOK_SENSITIVITY = 0.0022;

/** Briefly block pointer-lock so rake/drag clicks don't immediately re-lock. */
let suppressPointerLockUntil = 0;

export function suppressPointerLock(ms = 400) {
  suppressPointerLockUntil = performance.now() + ms;
  if (typeof document !== "undefined" && document.pointerLockElement) {
    document.exitPointerLock();
  }
}

type FirstPersonControlsProps = {
  eyeHeight?: number;
  bounds?: number;
  enabled?: boolean;
  /** Initial yaw in radians (0 looks toward -Z). */
  initialYaw?: number;
  onLockChange?: (locked: boolean) => void;
  /** Path / maze collision. Return false to block the move. */
  canMoveTo?: (x: number, z: number) => boolean;
  /** Fired every frame with world XZ and yaw (for minimap). */
  onPosition?: (x: number, z: number, yaw: number) => void;
  /** Auto-pilot mode to guide player along route to exit. */
  autoPilot?: boolean;
  autoPilotRoute?: { x: number; z: number }[];
  teleportTarget?: { x: number; z: number; yaw?: number } | null;
  onAutoPilotComplete?: () => void;
  onManualInterrupt?: () => void;
};

/**
 * WASD walk + pointer-lock mouse look.
 * Optional canMoveTo confines the player to maze path corridors.
 */
export function FirstPersonControls({
  eyeHeight = 1.6,
  bounds = 10,
  enabled = true,
  initialYaw = 0,
  onLockChange,
  canMoveTo,
  onPosition,
  autoPilot = false,
  autoPilotRoute,
  teleportTarget = null,
  onAutoPilotComplete,
  onManualInterrupt,
}: FirstPersonControlsProps) {
  const { camera, gl } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const euler = useRef({ yaw: initialYaw, pitch: 0.0 });
  const velocity = useRef(new Vector3());
  const locked = useRef(false);
  const waypointIdx = useRef(0);
  const enabledRef = useRef(enabled);
  const canMoveToRef = useRef(canMoveTo);
  const onPositionRef = useRef(onPosition);
  enabledRef.current = enabled;
  canMoveToRef.current = canMoveTo;
  onPositionRef.current = onPosition;

  // Handle instant teleportation
  useEffect(() => {
    if (teleportTarget) {
      camera.position.x = teleportTarget.x;
      camera.position.z = teleportTarget.z;
      camera.position.y = eyeHeight;
      if (typeof teleportTarget.yaw === "number") {
        euler.current.yaw = teleportTarget.yaw;
        euler.current.pitch = 0;
      }
      onPositionRef.current?.(teleportTarget.x, teleportTarget.z, euler.current.yaw);
    }
  }, [teleportTarget, camera, eyeHeight]);

  // Reset waypoint index when autopilot is toggled on
  useEffect(() => {
    if (autoPilot && autoPilotRoute && autoPilotRoute.length > 0) {
      let bestIdx = 0;
      let bestDist = Infinity;
      autoPilotRoute.forEach((pt, i) => {
        const d = Math.hypot(pt.x - camera.position.x, pt.z - camera.position.z);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      });
      waypointIdx.current = Math.min(bestIdx + 1, autoPilotRoute.length - 1);
    }
  }, [autoPilot, autoPilotRoute, camera.position]);

  useEffect(() => {
    euler.current.yaw = initialYaw;
    euler.current.pitch = 0.0;
    camera.up.set(0, 1, 0);
    camera.rotation.order = "YXZ";
    camera.rotation.set(0.0, initialYaw, 0.0);
    camera.position.y = eyeHeight;
  }, [camera, eyeHeight, initialYaw]);

  useEffect(() => {
    if (!enabled) {
      if (document.pointerLockElement === gl.domElement) {
        document.exitPointerLock();
      }
      return;
    }

    const el = gl.domElement;
    let isMouseDown = false;
    let lastX = 0;
    let lastY = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (e.code === "Escape" && locked.current) {
        e.stopPropagation();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!enabledRef.current) return;
      isMouseDown = true;
      lastX = e.clientX;
      lastY = e.clientY;
      startForestAudio();

      if (!locked.current && performance.now() >= suppressPointerLockUntil) {
        try {
          const promise = el.requestPointerLock?.();
          if (promise && typeof promise.catch === "function") {
            promise.catch(() => {
              // Silently fallback to drag-to-look if pointer lock rejected
            });
          }
        } catch {
          // Fallback to drag-to-look
        }
      }
    };

    const onPointerUp = () => {
      isMouseDown = false;
    };

    const onPointerLockChange = () => {
      const isLocked = document.pointerLockElement === el;
      locked.current = isLocked;
      onLockChange?.(isLocked);
    };

    const onPointerLockError = () => {
      locked.current = false;
      onLockChange?.(false);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!enabledRef.current) return;
      if (locked.current) {
        // Pointer-locked mode: use movement deltas
        const dx = e.movementX ?? 0;
        const dy = e.movementY ?? 0;
        euler.current.yaw -= dx * LOOK_SENSITIVITY;
        euler.current.pitch -= dy * LOOK_SENSITIVITY;
        euler.current.pitch = Math.max(-1.3, Math.min(1.3, euler.current.pitch));
      } else if (isMouseDown) {
        // Drag-to-look fallback
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        euler.current.yaw -= dx * LOOK_SENSITIVITY * 1.2;
        euler.current.pitch -= dy * LOOK_SENSITIVITY * 1.2;
        euler.current.pitch = Math.max(-1.3, Math.min(1.3, euler.current.pitch));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointerlockchange", onPointerLockChange);
    document.addEventListener("pointerlockerror", onPointerLockError);
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      document.removeEventListener("pointerlockerror", onPointerLockError);
      window.removeEventListener("mousemove", onMouseMove);
      if (document.pointerLockElement === el) document.exitPointerLock();
    };
  }, [gl, enabled, onLockChange]);

  useFrame((_, delta) => {
    if (!enabled) return;
    const dt = Math.min(delta, 1 / 30);

    camera.rotation.order = "YXZ";
    camera.rotation.set(euler.current.pitch, euler.current.yaw, 0);

    const forward = new Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() > 0) forward.normalize();
    const right = new Vector3()
      .crossVectors(forward, new Vector3(0, 1, 0))
      .normalize();

    velocity.current.set(0, 0, 0);
    const k = keys.current;
    const slow = k.ShiftLeft || k.ShiftRight ? 0.35 : 1;
    if (k.KeyW || k.ArrowUp) velocity.current.add(forward);
    if (k.KeyS || k.ArrowDown) velocity.current.sub(forward);
    if (k.KeyA || k.ArrowLeft) velocity.current.sub(right);
    if (k.KeyD || k.ArrowRight) velocity.current.add(right);

    const isManualMoving = Boolean(
      k.KeyW ||
        k.KeyS ||
        k.KeyA ||
        k.KeyD ||
        k.ArrowUp ||
        k.ArrowDown ||
        k.ArrowLeft ||
        k.ArrowRight,
    );

    if (isManualMoving && autoPilot) {
      onManualInterrupt?.();
    }

    if (autoPilot && autoPilotRoute && autoPilotRoute.length > 0 && !isManualMoving) {
      const target = autoPilotRoute[waypointIdx.current];
      if (target) {
        const dx = target.x - camera.position.x;
        const dz = target.z - camera.position.z;
        const dist = Math.hypot(dx, dz);

        if (dist < 0.8) {
          if (waypointIdx.current < autoPilotRoute.length - 1) {
            waypointIdx.current++;
          } else {
            onAutoPilotComplete?.();
          }
        } else {
          // Smoothly look toward waypoint
          const targetYaw = Math.atan2(-dx, -dz);
          const diff = (targetYaw - euler.current.yaw + Math.PI * 3) % (Math.PI * 2) - Math.PI;
          euler.current.yaw += diff * Math.min(1, dt * 7.5);
          euler.current.pitch *= 0.92;

          // Cruise forward
          const autoSpeed = 11.0;
          const step = Math.min(dist, autoSpeed * dt);
          camera.position.x += (dx / dist) * step;
          camera.position.z += (dz / dist) * step;
        }
      }
    } else if (velocity.current.lengthSq() > 0) {
      playForestFootstep();
      velocity.current.normalize().multiplyScalar(SPEED * slow * dt);
      const totalMove = velocity.current.clone();
      const check = canMoveToRef.current;

      if (!check) {
        camera.position.x += totalMove.x;
        camera.position.z += totalMove.z;
      } else {
        // Continuous collision sub-stepping (max 4cm per sub-step to prevent tunneling)
        const moveDist = totalMove.length();
        const maxSubStep = 0.04;
        const steps = Math.max(1, Math.ceil(moveDist / maxSubStep));
        const stepX = totalMove.x / steps;
        const stepZ = totalMove.z / steps;

        for (let s = 0; s < steps; s++) {
          let currX = camera.position.x;
          let currZ = camera.position.z;
          const nextX = currX + stepX;
          const nextZ = currZ + stepZ;

          // Try moving both axes simultaneously
          if (check(nextX, nextZ)) {
            camera.position.x = nextX;
            camera.position.z = nextZ;
          } else {
            // Axis slide along obstacle surface: try X alone
            if (check(nextX, currZ)) {
              camera.position.x = nextX;
              currX = nextX;
            }
            // Axis slide: try Z alone
            if (check(currX, nextZ)) {
              camera.position.z = nextZ;
              currZ = nextZ;
            }
          }
        }
      }
    }

    camera.position.y = eyeHeight;
    camera.position.x = Math.max(-bounds, Math.min(bounds, camera.position.x));
    camera.position.z = Math.max(-bounds, Math.min(bounds, camera.position.z));

    onPositionRef.current?.(
      camera.position.x,
      camera.position.z,
      euler.current.yaw,
    );
  });

  return null;
}
