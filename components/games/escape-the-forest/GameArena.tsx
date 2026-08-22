"use client";

import { Maximize2, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { GardenLoader } from "@/components/games/gardens/GardenLoader";
import { FullscreenSandbox } from "@/components/games/FullscreenSandbox";
import { DEFAULT_MODEL, getGarden } from "@/lib/games/registry";
import { isForestAudioMuted, setForestAudioMuted } from "@/components/games/gardens/forestAudio";

const MODEL_ID = DEFAULT_MODEL;

export function GameArena() {
  const [fullscreen, setFullscreen] = useState(false);
  const [muted, setMuted] = useState(isForestAudioMuted());
  const model = getGarden(MODEL_ID);

  const toggleSound = () => {
    const next = !muted;
    setForestAudioMuted(next);
    setMuted(next);
  };

  return (
    <>
      <div className="flex h-[calc(100vh-3.5rem)] flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Arena</h2>
            <p className="text-sm text-foreground/60">
              {model?.name ?? "Monsoon Jungle Labyrinth"} — find the Ancient Stone Gateway.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSound}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur transition hover:border-emerald-500 hover:text-emerald-500"
              title={muted ? "Unmute Sound" : "Mute Sound"}
            >
              {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              <span>{muted ? "Unmute" : "Sound"}</span>
            </button>
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur transition hover:border-primary hover:text-primary"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Fullscreen
            </button>
          </div>
        </div>

        <section className="relative min-h-0 flex-1">
          <GardenLoader modelId={MODEL_ID} />
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-white/10 bg-black/40 px-2.5 py-1.5 text-[10px] text-white/80 backdrop-blur">
            Click to look · WASD walk · Esc free cursor
          </div>
        </section>
      </div>

      <FullscreenSandbox
        modelId={fullscreen ? MODEL_ID : null}
        onClose={() => setFullscreen(false)}
      />
    </>
  );
}
