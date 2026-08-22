"use client";

import dynamic from "next/dynamic";
import { Component, Suspense, useEffect, useState, type ComponentType, type ReactNode } from "react";
import type { GardenSceneProps } from "@/components/games/gardens/types";
import { getGarden } from "@/lib/games/registry";

/* ── Error Boundary ─────────────────────────────────────────────────────── */

type EBState = { hasError: boolean; error?: string };

class GameErrorBoundary extends Component<{ children: ReactNode; label: string }, EBState> {
  constructor(props: { children: ReactNode; label: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error: error?.message ?? "Unknown error" };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-background text-sm text-foreground/70 p-6 text-center">
          <span className="text-3xl">🌲</span>
          <p className="font-semibold text-foreground">Could not load {this.props.label}</p>
          <p className="text-xs text-foreground/50 max-w-xs">
            WebGL may not be supported in your browser, or the 3D engine encountered an error.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 rounded-md bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── Dynamic loaders (created at module level — ssr: false) ─────────────── */

const GrokScene = dynamic(() => import("@/components/games/gardens/grok-4-5"), {
  ssr: false,
});

const LOADERS: Record<string, ComponentType<GardenSceneProps>> = {
  "grok-4-5": GrokScene,
};

/* ── Fallback UI ────────────────────────────────────────────────────────── */

function GardenFallback({ label, timed_out = false }: { label: string; timed_out?: boolean }) {
  if (timed_out) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-background text-sm text-foreground/60 p-6 text-center">
        <span className="text-3xl animate-pulse">🌲</span>
        <p>Loading {label} is taking longer than usual…</p>
        <p className="text-xs text-foreground/40">
          Make sure WebGL is enabled in your browser.
        </p>
      </div>
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center gap-2 bg-background text-sm text-foreground/60">
      <span className="animate-pulse">🌲</span>
      Entering {label} forest…
    </div>
  );
}

/* ── Loader with timeout detection ──────────────────────────────────────── */

function GardenWithTimeout({
  Scene,
  interactive,
  label,
}: {
  Scene: ComponentType<GardenSceneProps>;
  interactive: boolean;
  label: string;
}) {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 15_000);
    return () => clearTimeout(t);
  }, []);

  return (
    <Suspense fallback={<GardenFallback label={label} timed_out={timedOut} />}>
      <Scene interactive={interactive} />
    </Suspense>
  );
}

/* ── Public component ───────────────────────────────────────────────────── */

type GardenLoaderProps = GardenSceneProps & {
  modelId: string;
  className?: string;
};

export function GardenLoader({
  modelId,
  interactive = true,
  className = "",
}: GardenLoaderProps) {
  const entry = getGarden(modelId);
  const Scene = LOADERS[modelId];

  if (!entry || !Scene) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-background text-sm text-red-500 ${className}`}
      >
        Unknown arena: {modelId}
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <GameErrorBoundary label={entry.name}>
        <GardenWithTimeout Scene={Scene} interactive={interactive} label={entry.name} />
      </GameErrorBoundary>
    </div>
  );
}
