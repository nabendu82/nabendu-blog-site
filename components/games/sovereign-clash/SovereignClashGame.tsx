"use client";

import { GameCanvas } from "./scene/GameCanvas";
import { HUD } from "./ui/HUD";

export default function SovereignClashGame() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1a2214] select-none font-serif">
      <GameCanvas />
      <HUD />
    </div>
  );
}
