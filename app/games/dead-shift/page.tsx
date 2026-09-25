import type { Metadata } from "next";
import { GameArena } from "@/components/games/dead-shift/GameArena";

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
      <GameArena />
      <p className="mx-auto max-w-4xl px-4 py-6 text-center text-sm leading-relaxed text-stone-300">
        An endless 3D zombie survival game where every run begins from scratch. Fight increasingly
        dangerous infected, level up during the run, and evolve modern firearms through three
        distinct weapon paths.
      </p>
    </div>
  );
}
