"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, Component, type ReactNode } from "react";
import { Maximize2, Minimize2, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { useGameStore } from "./game/store";

const DynamicSovereignClash = dynamic(
  () => import("./SovereignClashGame"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#1a2214] text-amber-200">
        <span className="text-4xl animate-bounce">⚔️</span>
        <p className="font-serif text-lg font-semibold tracking-wider text-amber-100">
          Mobilizing Armies &amp; Generating Territory…
        </p>
        <p className="text-xs text-amber-200/60">
          Preparing 3D RTS terrain, fog of war, and procedural units.
        </p>
      </div>
    ),
  }
);

class GameErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error?.message ?? "Unknown error" };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#1a2214] p-6 text-center text-amber-200">
          <span className="text-3xl">🏰</span>
          <p className="font-semibold text-amber-100">Could not initialize Sovereign Clash</p>
          <p className="max-w-xs text-xs text-amber-200/60">
            WebGL may not be enabled, or the 3D graphics pipeline encountered an issue.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 rounded bg-amber-600 px-4 py-1.5 text-xs font-semibold text-black transition hover:bg-amber-500"
          >
            Retry Battlefield
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function GameArena() {
  const [fullscreen, setFullscreen] = useState(false);
  const muted = useGameStore((s) => s.muted);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && fullscreen) {
        setFullscreen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullscreen]);

  return (
    <>
      <div className="flex h-[calc(100vh-3.5rem)] flex-col">
        {/* Arena Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur sm:px-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Battlefield Arena
            </h2>
            <p className="text-xs text-foreground/60 sm:text-sm">
              Sovereign Clash — Age of Empires style 3D RTS. Command your civilization to victory.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => useGameStore.getState().toggleMute()}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-amber-500/50 hover:text-amber-400"
              title={muted ? "Unmute Sound" : "Mute Sound"}
            >
              {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              <span>{muted ? "Unmute" : "Sound"}</span>
            </button>
            <button
              type="button"
              onClick={() => useGameStore.getState().restart()}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-amber-500/50 hover:text-amber-400"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restart</span>
            </button>
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-amber-500/50 hover:text-amber-400"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Fullscreen</span>
            </button>
          </div>
        </div>

        {/* 3D Game Area */}
        <section className="relative min-h-0 flex-1 overflow-hidden">
          <GameErrorBoundary>
            <DynamicSovereignClash />
          </GameErrorBoundary>
          <div className="pointer-events-none absolute bottom-3 left-3 z-20 rounded-md border border-white/10 bg-black/60 px-2.5 py-1.5 text-[10px] text-amber-200/90 backdrop-blur">
            Left Click: Select/Drag-box · Right Click: Move/Attack/Gather · WASD/Arrows: Pan Camera · Scroll: Zoom
          </div>
        </section>
      </div>

      {/* Fullscreen Sandbox Overlay */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="absolute right-4 top-3 z-30 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className="inline-flex items-center gap-1.5 rounded-md border border-amber-600/60 bg-black/80 px-3 py-1.5 text-xs font-medium text-amber-200 shadow-xl backdrop-blur transition hover:bg-amber-950"
            >
              <Minimize2 className="h-3.5 w-3.5" />
              <span>Exit Fullscreen (Esc)</span>
            </button>
          </div>
          <div className="relative h-full w-full">
            <GameErrorBoundary>
              <DynamicSovereignClash />
            </GameErrorBoundary>
          </div>
        </div>
      )}
    </>
  );
}
