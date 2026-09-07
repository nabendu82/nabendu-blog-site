"use client";

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { HUD_SYNC_INTERVAL } from '../game/constants'
import { tick } from '../game/simulation'
import { consumeHudDirty, syncHud, useGameStore } from '../game/store'

export function GameLoop() {
  const hudAccum = useRef(0)
  const simulationAccum=useRef(0)

  useFrame((_, delta) => {
    if (useGameStore.getState().helpOpen) return
    simulationAccum.current+=Math.min(delta,0.2)
    let steps=0
    while(simulationAccum.current>=1/30 && steps<5){tick(1/30);simulationAccum.current-=1/30;steps++}
    simulationAccum.current=Math.min(simulationAccum.current,1/30)
    hudAccum.current += delta
    if (hudAccum.current >= HUD_SYNC_INTERVAL) {
      hudAccum.current = 0
      consumeHudDirty()
      syncHud()
    }
  })

  return null
}
