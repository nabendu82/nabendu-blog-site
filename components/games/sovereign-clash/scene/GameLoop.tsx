"use client";

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { HUD_SYNC_INTERVAL } from '../game/constants'
import { tick } from '../game/simulation'
import { consumeHudDirty, syncHud, useGameStore } from '../game/store'

export function GameLoop() {
  const hudAccum = useRef(0)

  useFrame((_, delta) => {
    if (useGameStore.getState().helpOpen) return
    const dt = Math.min(delta, 0.05)
    tick(dt)
    hudAccum.current += dt
    if (consumeHudDirty() || hudAccum.current >= HUD_SYNC_INTERVAL) {
      hudAccum.current = 0
      syncHud()
    }
  })

  return null
}
