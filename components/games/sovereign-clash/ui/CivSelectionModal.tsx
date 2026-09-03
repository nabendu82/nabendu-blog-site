"use client";

import { useState } from 'react'
import { Crown, Swords, ShieldAlert, Sparkles, X } from 'lucide-react'
import { CIV_DETAILS } from '../game/constants'
import { useGameStore } from '../game/store'
import type { Civilization } from '../game/types'

const CIV_LIST: Civilization[] = ['indian', 'british', 'japanese', 'french']

export function CivSelectionModal() {
  const civModalOpen = useGameStore((s) => s.civModalOpen)
  const currentP = useGameStore((s) => s.playerCiv)
  const currentE = useGameStore((s) => s.enemyCiv)
  const gameTime = useGameStore((s) => s.gameTime)

  const [selectedPlayer, setSelectedPlayer] = useState<Civilization>(currentP ?? 'indian')
  const [selectedEnemy, setSelectedEnemy] = useState<Civilization>(currentE ?? 'british')

  if (!civModalOpen) return null

  const handleStart = () => {
    useGameStore.getState().setCivilizations(selectedPlayer, selectedEnemy)
  }

  const handleClose = () => {
    useGameStore.getState().closeCivModal()
  }

  const playerInfo = CIV_DETAILS[selectedPlayer]
  const enemyInfo = CIV_DETAILS[selectedEnemy]

  return (
    <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-sm">
      <div className="relative flex max-h-[min(48rem,96vh)] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-amber-500/40 bg-gradient-to-b from-[#241a12] via-[#1a120b] to-[#0d0905] shadow-[0_0_50px_rgba(0,0,0,0.9)]">
        {/* Header with Title & Close */}
        <div className="flex items-center justify-between border-b border-amber-600/30 px-6 py-4 bg-gradient-to-r from-amber-950/40 via-transparent to-amber-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/50 bg-amber-500/20 shadow-inner">
              <Crown className="text-amber-300" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-wide text-amber-100 uppercase">
                Choose Your Empire
              </h2>
              <p className="text-xs text-amber-200/70">
                Select your civilization and commander to clash on the battlefield
              </p>
            </div>
          </div>
          {gameTime > 0.1 && (
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-amber-600/30 p-1.5 text-amber-200/70 hover:bg-amber-500/20 hover:text-amber-100 transition"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* SECTION 1: Player Civ Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold tracking-wider text-amber-300 uppercase flex items-center gap-2">
                <Crown size={16} /> 1. Your Empire (Player)
              </span>
              <span className="text-xs text-emerald-400 font-medium bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                Controlling: {playerInfo.name}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {CIV_LIST.map((civ) => {
                const info = CIV_DETAILS[civ]
                const isSelected = selectedPlayer === civ
                return (
                  <button
                    key={`p-${civ}`}
                    type="button"
                    onClick={() => setSelectedPlayer(civ)}
                    className={`relative text-left p-3.5 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? 'border-amber-400 bg-gradient-to-b from-amber-500/25 to-amber-900/30 shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-2 ring-amber-400/50'
                        : 'border-amber-700/30 bg-black/40 hover:border-amber-500/50 hover:bg-black/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{info.flag}</span>
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded border uppercase"
                        style={{
                          backgroundColor: `${info.color}25`,
                          borderColor: `${info.color}80`,
                          color: '#fef3c7',
                        }}
                      >
                        {info.badge}
                      </span>
                    </div>

                    <div className="mt-2 text-base font-bold text-amber-100">{info.name}</div>
                    <div className="text-xs text-amber-300/80 font-medium">{info.title}</div>

                    <div className="mt-2.5 rounded-md bg-black/50 border border-amber-600/20 p-2">
                      <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                        <Sparkles size={11} /> Civ Advantage
                      </div>
                      <div className="text-[11px] text-amber-100/90 leading-tight mt-0.5">
                        {info.bonusSummary}
                      </div>
                    </div>

                    <div className="mt-2 text-[10px] text-amber-200/60 line-clamp-2">
                      {info.description}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* SECTION 2: Enemy Civ Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold tracking-wider text-rose-300 uppercase flex items-center gap-2">
                <ShieldAlert size={16} /> 2. Enemy Empire (AI Opponent)
              </span>
              <span className="text-xs text-rose-400 font-medium bg-rose-950/60 border border-rose-500/30 px-2.5 py-0.5 rounded-full">
                Opponent: {enemyInfo.name}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {CIV_LIST.map((civ) => {
                const info = CIV_DETAILS[civ]
                const isSelected = selectedEnemy === civ
                return (
                  <button
                    key={`e-${civ}`}
                    type="button"
                    onClick={() => setSelectedEnemy(civ)}
                    className={`relative text-left p-3.5 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? 'border-rose-400 bg-gradient-to-b from-rose-500/25 to-rose-900/30 shadow-[0_0_20px_rgba(244,63,94,0.25)] ring-2 ring-rose-400/50'
                        : 'border-amber-700/30 bg-black/40 hover:border-rose-500/50 hover:bg-black/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{info.flag}</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded border border-rose-500/40 bg-rose-500/20 text-rose-200 uppercase">
                        AI Rival
                      </span>
                    </div>

                    <div className="mt-2 text-base font-bold text-rose-100">{info.name}</div>
                    <div className="text-xs text-rose-300/80 font-medium">{info.title}</div>

                    <div className="mt-2.5 rounded-md bg-black/50 border border-rose-600/20 p-2">
                      <div className="text-[10px] uppercase font-bold text-rose-300 flex items-center gap-1">
                        <Swords size={11} /> AI Army Roster
                      </div>
                      <div className="text-[11px] text-rose-100/90 leading-tight mt-0.5">
                        {info.uniqueUnits.slice(0, 3).join(', ')}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* SECTION 3: Match Summary & Unit Preview */}
          <div className="rounded-xl border border-amber-500/30 bg-black/50 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-l-2 border-emerald-500 pl-3">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                Your Arsenal ({playerInfo.name})
              </div>
              <div className="mt-1 text-xs text-amber-100">
                <span className="font-semibold text-amber-200">Unique Buildings:</span>{' '}
                {playerInfo.uniqueBuildings.join(', ')}
              </div>
              <div className="mt-1 text-xs text-amber-100">
                <span className="font-semibold text-amber-200">Military Units:</span>{' '}
                {playerInfo.uniqueUnits.join(', ')}
              </div>
            </div>

            <div className="border-l-2 border-rose-500 pl-3">
              <div className="text-xs font-bold text-rose-400 uppercase tracking-wide">
                Enemy Threat ({enemyInfo.name})
              </div>
              <div className="mt-1 text-xs text-amber-100">
                <span className="font-semibold text-amber-200">Enemy Perk:</span>{' '}
                {enemyInfo.bonusSummary}
              </div>
              <div className="mt-1 text-xs text-amber-100">
                <span className="font-semibold text-amber-200">Invasion Forces:</span>{' '}
                {enemyInfo.uniqueUnits.join(', ')}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-amber-600/30 px-6 py-4 bg-black/60">
          <div className="text-xs text-amber-200/70">
            Clash: <span className="text-emerald-400 font-semibold">{playerInfo.name}</span> vs{' '}
            <span className="text-rose-400 font-semibold">{enemyInfo.name}</span>
          </div>

          <button
            type="button"
            onClick={handleStart}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 px-6 py-2.5 text-sm font-bold text-black shadow-lg shadow-amber-500/30 hover:brightness-110 active:scale-95 transition"
          >
            <Swords size={18} />
            Begin Sovereign Clash
          </button>
        </div>
      </div>
    </div>
  )
}
