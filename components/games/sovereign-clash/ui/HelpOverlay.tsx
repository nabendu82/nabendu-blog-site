"use client";

import { CircleHelp, Play, X } from 'lucide-react'
import { GAME_TITLE } from '../game/constants'
import { useGameStore } from '../game/store'

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-200/90">{title}</h3>
      <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-amber-50/90">
        {items.map((item) => (
          <li key={item} className="pl-3" style={{ textIndent: '-0.65rem' }}>
            <span className="mr-1.5 text-amber-400/80">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function HelpOverlay() {
  const helpOpen = useGameStore((s) => s.helpOpen)
  const gameTime = useGameStore((s) => s.gameTime)
  if (!helpOpen) return null

  const started = gameTime > 0.05
  const playLabel = started ? 'Resume' : 'Play'

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/65 p-4">
      <div className="relative flex max-h-[min(44rem,92vh)] w-full max-w-3xl flex-col overflow-hidden rounded-md border border-amber-700 bg-gradient-to-b from-[#3a2a18] to-[#1a120a] shadow-2xl">
        <button
          type="button"
          className="absolute right-3 top-3 z-10 rounded-sm p-1 text-amber-200/80 hover:bg-black/30 hover:text-amber-50"
          aria-label="Close help"
          onClick={() => useGameStore.getState().closeHelp()}
        >
          <X size={18} />
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-2 pt-6">
          <div className="pr-8 text-2xl font-bold text-amber-100">{GAME_TITLE}</div>
          <p className="mt-1 text-sm text-amber-200/75">
            Destroy the British Town Center to win. The match stays paused until you press {playLabel}.
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Section
              title="Controls"
              items={[
                'Left-click to select a unit or building',
                'Drag a box to select many units; Shift-click to add or remove',
                'Right-click to move, gather, attack, or set a rally point',
                'F or Attack-move: soldiers fight enemies they pass',
                'Box or Line formation on the command bar for group moves',
                '. (period) selects the next idle villager',
                'Ctrl+1–9 saves a control group; 1–9 recalls it',
                'WASD or arrow keys pan; mouse wheel zooms; middle-drag pans',
                'Escape cancels placement, attack-move, or selection',
              ]}
            />
            <Section
              title="Indian economy"
              items={[
                'Villagers cost 100 Wood and gather wood, berries, herds, and gold',
                'Sacred Fields generate Food continuously once built',
                'Drop off at the Town Center, or closer Lumber Camps, Mills, and Mining Camps',
                'Discovery → Commerce costs 800 Food; Commerce → Fortress costs 1200 Food and 1000 Gold',
                'Houses add +10 population; the Town Center starts at 20 pop',
              ]}
            />
            <Section
              title="Ages & army"
              items={[
                'Commerce unlocks Barracks (Sepoy, Rajput) and Caravanserai (Sowar)',
                'Fortress unlocks Gurkha, Mahout Lancer, Siege Elephant, Agra Fort, and the Foundry',
                'Cavalry beats ranged infantry; pikes and Sepoys beat cavalry; elephants soak damage; siege smashes buildings',
                'Palisades block pathing; Agra Fort auto-fires on nearby enemies',
              ]}
            />
            <Section
              title="British enemy"
              items={[
                'Red-brick Town Center across the map; Manors spawn free settlers',
                'They age to Commerce at 8:00 and Fortress at 18:00',
                'Wave 1 ~10:00: longbows, pikes, and redcoats',
                'Wave 2 ~18:00: redcoats and hussars',
                'Wave 3 ~26:00: redcoats, dragoons, and a Falconet cannon',
                'Raids keep coming every 4 minutes until a Town Center falls; each raid is larger and the British Town Center gains two more guards',
              ]}
            />
          </div>
        </div>

        <div className="flex shrink-0 justify-center border-t border-amber-800/50 bg-[#1a120a] px-7 py-4">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-sm border border-amber-500 bg-[#2a1d10] px-8 py-2.5 text-sm font-semibold text-amber-50 hover:bg-[#3b2a16]"
            onClick={() => useGameStore.getState().closeHelp()}
          >
            <Play size={16} fill="currentColor" />
            {playLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function HelpButton() {
  const helpOpen = useGameStore((s) => s.helpOpen)
  const winner = useGameStore((s) => s.winner)
  if (helpOpen || winner) return null

  return (
    <button
      type="button"
      className="pointer-events-auto absolute bottom-28 right-4 z-20 inline-flex items-center gap-2 rounded-sm border border-amber-700/70 bg-[#2c1e10]/95 px-3 py-2 text-xs text-amber-50 shadow-xl hover:bg-[#3b2a16]"
      onClick={() => useGameStore.getState().openHelp()}
    >
      <CircleHelp size={16} />
      Help / Controls
    </button>
  )
}
