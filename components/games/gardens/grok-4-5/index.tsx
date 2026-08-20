"use client";

import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GardenSceneProps } from "@/components/games/gardens/types";
import { FirstPersonControls } from "@/components/games/gardens/FirstPersonControls";
import { ZenGardenScene } from "./scene";
import { JUNGLE_LAYOUT, GARDEN_HALF } from "./maze";
import { Minimap } from "./Minimap";

const TIMER_SECONDS = 1200;

function formatClock(total: number) {
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/**
 * 3D Indian Monsoon Jungle Escape Arena.
 * Features massive dense Sal and Teak forest canopy, sub-canopy layer,
 * wild bamboo groves, serene freshwater Lotus Pond, and game objective feedback.
 */
export default function ZenGarden({ interactive = true }: GardenSceneProps) {
  const [resetKey, setResetKey] = useState(0);
  const [locked, setLocked] = useState(false);
  const [escaped, setEscaped] = useState(false);
  const [dead, setDead] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS);
  const [hint, setHint] = useState(
    "Click to look · WASD walk · follow the trails to find the Ancient Stone Gateway",
  );
  const [player, setPlayer] = useState({
    x: JUNGLE_LAYOUT.startWorld[0],
    z: JUNGLE_LAYOUT.startWorld[2],
    yaw: JUNGLE_LAYOUT.startYaw,
  });
  const posRaf = useRef(0);

  const canMoveTo = useMemo(
    () => (x: number, z: number) => JUNGLE_LAYOUT.isWalkable(x, z),
    [],
  );

  useEffect(() => {
    if (escaped || dead) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [escaped, dead, resetKey]);

  useEffect(() => {
    if (secondsLeft === 0 && !escaped) {
      setDead(true);
    }
  }, [secondsLeft, escaped]);

  const onPosition = useCallback((x: number, z: number, yaw: number) => {
    const distToExit = Math.hypot(
      x - JUNGLE_LAYOUT.stoneGatewayPos[0],
      z - JUNGLE_LAYOUT.stoneGatewayPos[2],
    );
    if (distToExit < 3.2) {
      setEscaped(true);
    }

    if (posRaf.current) return;
    posRaf.current = requestAnimationFrame(() => {
      posRaf.current = 0;
      setPlayer({ x, z, yaw });
    });
  }, []);

  const resetGarden = useCallback(() => {
    setResetKey((k) => k + 1);
    setLocked(false);
    setEscaped(false);
    setDead(false);
    setSecondsLeft(TIMER_SECONDS);
    setPlayer({
      x: JUNGLE_LAYOUT.startWorld[0],
      z: JUNGLE_LAYOUT.startWorld[2],
      yaw: JUNGLE_LAYOUT.startYaw,
    });
    setHint("Jungle reset — find the Ancient Stone Gateway to escape");
  }, []);

  /* Dev Helpers - Disabled for production
  const startAutoPilot = useCallback(() => {
    if (dead || escaped) return;
    setAutoPilot(true);
    setHint("⚡ Auto-navigating along the escape path to the Ancient Stone Gateway... (WASD to interrupt)");
  }, [dead, escaped]);

  const teleportToExit = useCallback(() => {
    if (dead) return;
    setAutoPilot(false);
    setTeleportTarget({ x: 0, z: 74.2, yaw: Math.PI });
    setHint("🚀 Teleported to Ancient Stone Gateway!");
  }, [dead]);

  const onManualInterrupt = useCallback(() => {
    setAutoPilot(false);
    setHint("Manual control resumed · WASD walk · mouse look");
  }, []);
  */

  const onLockChange = useCallback((isLocked: boolean) => {
    setLocked(isLocked);
    setHint(
      isLocked
        ? "WASD walk · mouse look · Shift slow · Esc free cursor"
        : "Click to look · WASD walk · explore the jungle towards the Stone Gateway",
    );
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a120e]">
      <Canvas
        key={resetKey}
        shadows={false}
        dpr={[1, 1.5]}
        camera={{
          position: [...JUNGLE_LAYOUT.startWorld],
          fov: 62,
          near: 0.1,
          far: 500,
        }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          stencil: false,
        }}
        className="h-full w-full touch-none"
      >
        <ZenGardenScene night={dead} />
        {interactive ? (
          <FirstPersonControls
            eyeHeight={1.6}
            bounds={GARDEN_HALF - 0.5}
            enabled={!escaped && !dead}
            initialYaw={JUNGLE_LAYOUT.startYaw}
            onLockChange={onLockChange}
            canMoveTo={canMoveTo}
            onPosition={onPosition}
          />
        ) : null}
      </Canvas>

      {/* Countdown HUD */}
      <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-xl border border-emerald-500/20 bg-black/60 px-3 py-2 shadow-2xl backdrop-blur-md">
        <p className="font-mono text-lg font-semibold tracking-widest text-emerald-100 sm:text-xl">
          {formatClock(secondsLeft)}
        </p>
        <p className="text-[10px] uppercase tracking-wider text-emerald-200/60">
          until nightfall
        </p>
      </div>

      {/* Top Banner HUD Objective */}
      <div className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-xl border border-emerald-500/20 bg-black/60 px-4 py-2 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <p className="text-xs font-semibold tracking-wide text-emerald-100 sm:text-sm">
            Objective: Navigate the Monsoon Jungle to the Ancient Stone Gateway
          </p>
        </div>
      </div>

      {/* Minimap Overlay */}
      <Minimap maze={JUNGLE_LAYOUT} player={player} />

      {/* Crosshair when Pointer Locked */}
      {locked ? (
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2"
        >
          <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/60" />
          <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/60" />
        </div>
      ) : null}

      {/* Escape Victory Modal Overlay */}
      {escaped ? (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="max-w-md rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-[#182e1e] to-[#0c1a12] p-6 text-center shadow-2xl">
            <span className="text-4xl">🏛️</span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-emerald-200">
              Monsoon Jungle Escaped!
            </h2>
            <p className="mt-2 text-sm text-emerald-200/80">
              You navigated through the massive Sal and Teak forest canopy, past the Lotus Pond, and escaped through the Ancient Stone Gateway.
            </p>
            <button
              type="button"
              onClick={resetGarden}
              className="mt-6 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400"
            >
              Play Again
            </button>
          </div>
        </div>
      ) : null}

      {/* Night death overlay — timer expired before the green exit */}
      {dead && !escaped ? (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#02050c]/88 backdrop-blur-md">
          <div className="max-w-md rounded-2xl border border-red-900/50 bg-gradient-to-b from-[#1a1018] to-[#08060c] p-6 text-center shadow-2xl">
            <span className="text-4xl">🌙</span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-red-200">
              Night took the forest
            </h2>
            <p className="mt-2 text-sm text-red-100/75">
              The sun vanished before you reached the Ancient Stone Gateway. In the dark, the jungle&apos;s predators found you.
            </p>
            <button
              type="button"
              onClick={resetGarden}
              className="mt-6 rounded-lg bg-red-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-red-400"
            >
              Play Again
            </button>
          </div>
        </div>
      ) : null}

      {/* Bottom Controls Bar */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-2 p-3 sm:p-4">
        <p className="rounded-md border border-white/10 bg-black/40 px-3 py-1 text-[11px] text-white/80 backdrop-blur-md">
          {hint}
        </p>
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded-xl border border-white/15 bg-black/50 p-1.5 shadow-lg backdrop-blur-xl">
          {/* Dev Helpers - Disabled for production
          <button
            type="button"
            onClick={startAutoPilot}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              autoPilot
                ? "bg-amber-400 text-black shadow-lg animate-pulse"
                : "bg-amber-500/80 text-black hover:bg-amber-400"
            }`}
          >
            {autoPilot ? "⚡ Auto-Navigating..." : "⚡ Auto-Navigate"}
          </button>
          <button
            type="button"
            onClick={teleportToExit}
            className="rounded-lg bg-emerald-500/80 px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-emerald-400"
          >
            🚀 Teleport to Exit
          </button>
          */}
          <button
            type="button"
            onClick={resetGarden}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white transition hover:bg-white/20"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
