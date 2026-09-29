"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

/** Reduce pixel cost under sustained load, without changing simulation speed. */
export function AdaptiveResolution() {
  const sample = useRef({ elapsed: 0, frames: 0, warmup: 4 });
  useFrame(({ gl, viewport, setDpr }, dt) => {
    const data = sample.current;
    if (document.hidden || dt > .25) { data.elapsed = 0; data.frames = 0; return; }
    if (data.warmup > 0) { data.warmup -= dt; return; }
    data.elapsed += dt;
    data.frames++;
    if (data.elapsed < 2) return;
    const frameMs = data.elapsed * 1000 / data.frames;
    if (process.env.NODE_ENV !== "production") {
      gl.domElement.dataset.renderStats = JSON.stringify({ frameMs: Math.round(frameMs), calls: gl.info.render.calls, triangles: gl.info.render.triangles, dpr: viewport.dpr, geometries: gl.info.memory.geometries });
    }
    // Only step down: no repeated resolution oscillation in heavy scenes.
    if (frameMs > 25 && viewport.dpr > 1) setDpr(Math.max(1, viewport.dpr - .25));
    data.elapsed = 0; data.frames = 0;
  });
  return null;
}
