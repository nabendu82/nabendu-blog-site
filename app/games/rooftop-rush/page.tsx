import type { Metadata } from "next";
import { GameArena } from "@/components/games/rooftop-rush/GameArena";

export const metadata: Metadata = {
  title: "Rooftop Rush: Neo India | Nabendu",
  description: "Race across futuristic Indian rooftops. Jump gaps, slide under obstacles, collect energy cells and chase your best score with a custom Blender courier.",
  alternates: { canonical: "/games/rooftop-rush" },
};
export default function RooftopRushPage() {
  return <><GameArena /><div className="container max-w-3xl py-8 text-sm text-muted-foreground">
    <h2 className="mb-3 text-xl font-bold text-foreground">How to play</h2>
    <p>Choose Start Run, then use Left/Right or A/D to change lanes. Press Up, W or Space to jump and Down or S to slide. On touch screens, swipe in the direction you want to move. Collect energy cells, magnets, shields and overdrive boosts while avoiding obstacles and rooftop gaps.</p>
    <p className="mt-3">Press P or Escape to pause. Your best score is saved in this browser. Use Sound and Fullscreen above the game at any time.</p>
  </div></>;
}
