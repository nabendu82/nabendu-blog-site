import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "DEAD//SHIFT — 3D Zombie Survival Game | Nabendu",
  description:
    "Play DEAD//SHIFT, a browser-based 3D zombie survival game with endless infected hordes, in-run level progression and evolving modern firearms.",
  openGraph: {
    title: "DEAD//SHIFT — 3D Zombie Survival Game",
    description:
      "Survive an infected city, level up, and evolve modern firearms through three paths.",
    images: ["/games/dead-shift/preview.png"],
  },
};

export default function DeadShiftPage() {
  return (
    <div className="flex flex-col bg-[#0b1114] text-stone-100">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <div>
          <Link
            href="/games"
            className="text-xs font-semibold uppercase tracking-wider text-orange-300 hover:text-orange-200"
          >
            ← Back to Games
          </Link>
          <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">DEAD//SHIFT</h1>
          <p className="text-sm text-stone-300">Mutation Run</p>
        </div>
        <p className="text-xs text-stone-300 sm:text-sm">
          WASD — Move · Mouse — Aim · Left Click — Fire · Esc — Pause
        </p>
      </div>
      <section className="relative h-[calc(100dvh-10rem)] min-h-[480px] overflow-hidden bg-[#10191d]">
        <iframe
          title="DEAD//SHIFT playable game"
          src="/games/dead-shift/embed/index.html"
          className="h-full w-full border-0"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      </section>
      <p className="mx-auto max-w-4xl px-4 py-6 text-center text-sm leading-relaxed text-stone-300">
        An endless 3D zombie survival game where every run begins from scratch. Fight increasingly
        dangerous infected, level up during the run, and evolve modern firearms through three
        distinct weapon paths.
      </p>
    </div>
  );
}

