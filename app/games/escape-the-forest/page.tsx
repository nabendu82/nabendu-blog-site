import type { Metadata } from "next";
import { GameArena } from "@/components/games/escape-the-forest/GameArena";

export const metadata: Metadata = {
  title: "Escape the Forest | Nabendu Blog",
  description:
    "A 3D first-person escape game — navigate the Monsoon Jungle Labyrinth and find the Ancient Stone Gateway before nightfall.",
};

export default function EscapeTheForestPage() {
  return (
    <div className="flex flex-col">
      {/* Hero / Story Section */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #0d1f15 0%, hsl(var(--background)) 100%)",
        }}
      >
        {/* Forest canopy ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 50% -10%, rgba(34,107,56,0.3), transparent 55%),
              radial-gradient(ellipse 50% 40% at 80% 70%, rgba(180,130,40,0.15), transparent 55%)
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
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-black/50 px-3.5 py-1 text-xs font-semibold tracking-wide text-emerald-300 backdrop-blur-md shadow-lg">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            3D First-Person Jungle Escape
          </div>

          <h1 className="text-5xl font-extrabold leading-none tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] sm:text-7xl">
            Escape the Forest
          </h1>

          {/* Story Card */}
          <div className="mt-6 max-w-xl rounded-2xl border border-white/15 bg-black/60 p-5 shadow-2xl backdrop-blur-md">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
              The Story
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-emerald-50/90 sm:text-base">
              You are stranded in the heart of an untamed Indian Monsoon Jungle as dusk approaches.
              With only{" "}
              <strong className="font-semibold text-amber-300">20 minutes before nightfall</strong>,
              you must navigate the winding labyrinth of forest footpaths, avoid deceptive dead-ends,
              and locate the{" "}
              <strong className="font-semibold text-emerald-300">Ancient Stone Temple Gateway</strong>{" "}
              to escape.
            </p>
            <div className="mt-4 flex flex-wrap gap-4 border-t border-white/10 pt-3 text-xs text-emerald-200/80">
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400">🌲</span>
                <span>1,500+ Organic Trees &amp; Bamboo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400">⏱️</span>
                <span>20-Min Survival Countdown</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-teal-400">🧭</span>
                <span>Exploration &amp; Dead-Ends</span>
              </div>
            </div>
          </div>

          {/* Scroll-to-play CTA */}
          <p className="mt-6 text-sm font-medium text-emerald-300/80">
            ↓ Scroll down to play
          </p>
        </div>
      </div>

      {/* Game Arena */}
      <GameArena />
    </div>
  );
}
