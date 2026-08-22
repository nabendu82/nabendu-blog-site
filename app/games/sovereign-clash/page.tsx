import type { Metadata } from "next";
import { GameArena } from "@/components/games/sovereign-clash/GameArena";

export const metadata: Metadata = {
  title: "Sovereign Clash | Nabendu Site",
  description:
    "A 3D Real-Time Strategy (RTS) game inspired by Age of Empires. Command villagers, harvest resources, advance through historical ages, and lead armies to victory.",
};

export default function SovereignClashPage() {
  return (
    <div className="flex flex-col">
      {/* Hero / Historical Context Section */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #1f170c 0%, hsl(var(--background)) 100%)",
        }}
      >
        {/* Ambient Warm Golden/Embers Glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 50% -10%, rgba(217, 119, 6, 0.25), transparent 55%),
              radial-gradient(ellipse 50% 40% at 80% 70%, rgba(180, 83, 9, 0.15), transparent 55%)
            `,
          }}
        />
        {/* Noise texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-12 sm:px-6">
          {/* Badge */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-black/60 px-3.5 py-1 text-xs font-semibold tracking-wide text-amber-300 backdrop-blur-md shadow-lg">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            3D Real-Time Strategy · Age of Empires Style
          </div>

          <h1 className="text-5xl font-extrabold leading-none tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] sm:text-7xl">
            Sovereign Clash
          </h1>

          {/* Story Card */}
          <div className="mt-6 max-w-2xl rounded-2xl border border-white/15 bg-black/60 p-5 shadow-2xl backdrop-blur-md">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400">
              The Campaign
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-amber-50/90 sm:text-base">
              Establish and defend your sovereign settlement against advancing imperial forces.
              Gather <strong className="font-semibold text-amber-300">Food, Wood, and Gold</strong>,
              build Mills, Barracks, and Caravanserais, train fierce{" "}
              <strong className="font-semibold text-amber-200">Sepoys, Rajputs, Gurkhas, and Sowars</strong>,
              and conquer the enemy stronghold across dynamic fog-of-war terrain.
            </p>
            <div className="mt-4 flex flex-wrap gap-4 border-t border-white/10 pt-3 text-xs text-amber-200/80">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400">🌾</span>
                <span>Gather &amp; Economy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400">⚔️</span>
                <span>Tactical Combat &amp; Raids</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400">🏰</span>
                <span>Town Advancement</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400">🗺️</span>
                <span>Dynamic Fog of War</span>
              </div>
            </div>
          </div>

          {/* Scroll-to-play CTA */}
          <p className="mt-6 text-sm font-medium text-amber-300/80">
            ↓ Command your settlement below
          </p>
        </div>
      </div>

      {/* Game Arena */}
      <GameArena />
    </div>
  );
}
