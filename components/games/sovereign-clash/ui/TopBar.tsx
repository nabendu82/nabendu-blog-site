"use client";

import type { ReactNode } from 'react'
import { Apple, Coins, Crown, Flag, Swords, TreePine, Users, Volume2, VolumeOff } from 'lucide-react'
import {
  AGE_NAMES,
  AI_WAVE1_TIME,
  AI_WAVE2_TIME,
  AI_WAVE3_TIME,
  AI_WAVE_INTERVAL,
} from '../game/constants'
import { useGameStore } from '../game/store'

function Chip({
  icon,
  value,
  label,
  color,
}: {
  icon: ReactNode
  value: number | string
  label: string
  color: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-sm border border-amber-800/50 bg-black/35 px-3 py-1.5">
      <span className={color}>{icon}</span>
      <div className="leading-tight">
        <div className="text-[10px] uppercase tracking-wider text-amber-200/70">{label}</div>
        <div className="font-semibold tabular-nums text-amber-50">{value}</div>
      </div>
    </div>
  )
}

function clock(seconds: number): string {
  const left = Math.max(0, Math.ceil(seconds))
  const m = Math.floor(left / 60)
  const sec = left % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function formatRaid(gameTime: number, waveIndex: number, waveStartTime: number): string {
  if (waveIndex <= 0) return clock(AI_WAVE1_TIME - gameTime)
  if (waveIndex === 1) return clock(AI_WAVE2_TIME - gameTime)
  if (waveIndex === 2) return clock(AI_WAVE3_TIME - gameTime)
  return clock(waveStartTime + AI_WAVE_INTERVAL - gameTime)
}

export function TopBar() {
  const wood = useGameStore((s) => s.wood)
  const food = useGameStore((s) => s.food)
  const gold = useGameStore((s) => s.gold)
  const pop = useGameStore((s) => s.pop)
  const popCap = useGameStore((s) => s.popCap)
  const gameTime = useGameStore((s) => s.gameTime)
  const waveIndex = useGameStore((s) => s.waveIndex)
  const waveStartTime = useGameStore((s) => s.waveStartTime)
  const playerAge = useGameStore((s) => s.playerAge)
  const enemyAge = useGameStore((s) => s.enemyAge)
  const aging = useGameStore((s) => s.aging)
  const muted = useGameStore((s) => s.muted)

  return (
    <div className="pointer-events-auto flex items-center justify-center gap-3 rounded-b-md border-x border-b border-amber-700/60 bg-gradient-to-b from-[#3a2a18] to-[#24180e] px-4 py-2 shadow-xl">
      <Chip icon={<TreePine size={18} />} value={wood} label="Wood" color="text-emerald-400" />
      <Chip icon={<Apple size={18} />} value={food} label="Food" color="text-red-400" />
      <Chip icon={<Coins size={18} />} value={gold} label="Gold" color="text-yellow-400" />
      <Chip
        icon={<Users size={18} />}
        value={`${pop} / ${popCap}`}
        label="Pop"
        color="text-sky-300"
      />
      <Chip
        icon={<Crown size={18} />}
        value={aging ? 'Advancing…' : AGE_NAMES[playerAge]}
        label="Age"
        color="text-amber-300"
      />
      <Chip
        icon={<Flag size={18} />}
        value={AGE_NAMES[enemyAge]}
        label="British"
        color="text-red-300"
      />
      <Chip
        icon={<Swords size={18} />}
        value={formatRaid(gameTime, waveIndex, waveStartTime)}
        label={waveIndex <= 0 ? 'Enemy raid' : `Wave ${waveIndex + 1}`}
        color="text-red-300"
      />
      <button
        type="button"
        className="rounded-sm border border-amber-800/50 bg-black/35 p-2 text-amber-100 hover:bg-black/50"
        onClick={() => useGameStore.getState().toggleMute()}
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? <VolumeOff size={16} /> : <Volume2 size={16} />}
      </button>
    </div>
  )
}
