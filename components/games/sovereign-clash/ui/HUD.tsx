"use client";

import { CIV_DETAILS, GAME_TITLE } from '../game/constants'
import { CivSelectionModal } from './CivSelectionModal'
import { CommandBar } from './CommandBar'
import { HelpButton, HelpOverlay } from './HelpOverlay'
import { MarqueeOverlay } from './MarqueeOverlay'
import { Minimap } from './Minimap'
import { TopBar } from './TopBar'
import { useGameStore } from '../game/store'

function WinnerOverlay() {
  const winner = useGameStore((s) => s.winner)
  const playerCiv = useGameStore((s) => s.playerCiv)
  const enemyCiv = useGameStore((s) => s.enemyCiv)
  if (!winner) return null

  const victory = winner === 'player'
  const playerCivName = CIV_DETAILS[playerCiv]?.name ?? 'Empire'
  const enemyCivName = CIV_DETAILS[enemyCiv]?.name ?? 'Enemy'

  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-black/55">
      <div className="rounded-md border border-amber-700 bg-gradient-to-b from-[#3a2a18] to-[#1a120a] px-10 py-8 text-center shadow-2xl">
        <div className={`text-3xl font-bold ${victory ? 'text-amber-200' : 'text-red-300'}`}>
          {victory ? 'Victory' : 'Defeat'}
        </div>
        <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-amber-200/60">{GAME_TITLE}</p>
        <p className="mt-2 text-sm text-amber-100/80">
          {victory
            ? `The ${enemyCivName} Town Center has fallen.`
            : `Your ${playerCivName} Town Center has been destroyed.`}
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            className="rounded-sm border border-amber-600 bg-[#2a1d10] px-5 py-2 text-sm text-amber-50 hover:bg-[#3b2a16]"
            onClick={() => useGameStore.getState().restart()}
          >
            Rematch
          </button>
          <button
            type="button"
            className="rounded-sm border border-amber-500 bg-amber-600/30 px-5 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-600/50"
            onClick={() => useGameStore.getState().openCivModal()}
          >
            Change Empires
          </button>
        </div>
      </div>
    </div>
  )
}

export function HUD() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
      <MarqueeOverlay />
      <div className="flex items-start justify-between px-4 pt-0">
        <div className="pt-3 text-[11px] tracking-wide text-amber-100/80">
          {GAME_TITLE}
        </div>
        <TopBar />
        <div className="pt-3">
          <Minimap />
        </div>
      </div>
      <div className="flex-1" />
      <div className="flex justify-center px-4">
        <CommandBar />
      </div>
      <HelpButton />
      <HelpOverlay />
      <CivSelectionModal />
      <WinnerOverlay />
    </div>
  )
}
