"use client";

import Link from "next/link";
import { Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const GAME_URL = "/games/rooftop-rush/embed/index.html";

export function GameArena() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [muted, setMuted] = useState(false);

  const sendMute = (value: boolean) => {
    frame.current?.contentWindow?.postMessage(
      { type: "rooftop-rush:set-muted", muted: value },
      window.location.origin
    );
  };

  useEffect(() => {
    if (!fullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [fullscreen]);

  useEffect(() => {
    const requestState = () => frame.current?.contentWindow?.postMessage({ type: "rooftop-rush:get-state" }, window.location.origin);
    const handshake = window.setInterval(requestState, 500);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.source === frame.current?.contentWindow && event.data?.type === "rooftop-rush:state" && typeof event.data.muted === "boolean") { setMuted(event.data.muted); window.clearInterval(handshake); }
      if (
        event.origin === window.location.origin &&
        event.source === frame.current?.contentWindow &&
        event.data?.type === "rooftop-rush:escape"
      ) {
        setFullscreen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("message", onMessage);
    requestState();
    return () => {
      window.clearInterval(handshake);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("message", onMessage);
    };
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    sendMute(next);
  };

  const toggleFullscreen = () => {
    setFullscreen((value) => !value);
    frame.current?.focus();
  };

  const controlClass =
    "inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-[#182329] px-3 py-1.5 text-xs font-medium text-stone-100 transition hover:border-orange-400 hover:text-orange-200";

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-[100] flex h-dvh flex-col bg-[#0b1114] text-stone-100"
          : "flex h-[calc(100dvh-3.5rem)] min-h-[540px] flex-col bg-[#0b1114] text-stone-100"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <div>
          {!fullscreen && (
            <Link
              href="/games"
              className="text-xs font-semibold uppercase tracking-wider text-orange-300 hover:text-orange-200"
            >
              ← Back to Games
            </Link>
          )}
          <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Rooftop Rush</h1>
          <p className="text-sm text-stone-300">Neo India</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden text-xs text-stone-300 lg:inline">
            ← → / A D — Lanes · ↑ / Space — Jump · ↓ — Slide · P — Pause
          </span>
          <button
            type="button"
            onClick={toggleMute}
            className={controlClass}
            title={muted ? "Unmute Sound" : "Mute Sound"}
            aria-pressed={muted}
          >
            {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            {muted ? "Unmute" : "Sound"}
          </button>
          <button type="button" onClick={toggleFullscreen} className={controlClass}>
            {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            {fullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </div>
      </div>
      <section className="relative min-h-0 flex-1 overflow-hidden bg-[#10191d]">
        <iframe
          ref={frame}
          title="Rooftop Rush playable game"
          src={GAME_URL}
          onLoad={() => frame.current?.contentWindow?.postMessage({ type: "rooftop-rush:get-state" }, window.location.origin)}
          className="h-full w-full border-0"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      </section>
    </div>
  );
}

