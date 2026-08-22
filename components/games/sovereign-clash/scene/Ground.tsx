"use client";

import { Grid } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { COLORS, MAP_SIZE } from '../game/constants'
import { inputFlags } from '../game/input'
import { hover, useGameStore } from '../game/store'

export function Ground() {
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    hover.x = e.point.x
    hover.z = e.point.z
    hover.hit = true
  }

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (e.button !== 0) return
    if (inputFlags.skipClick) return
    const { placementKind, placeBuilding, commandMode, issueAttackMove, select } =
      useGameStore.getState()
    if (placementKind) {
      placeBuilding(e.point.x, e.point.z)
      return
    }
    if (commandMode === 'attackMove') {
      issueAttackMove(e.point.x, e.point.z)
      return
    }
    select(null)
  }

  const onContext = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    e.nativeEvent.preventDefault()
    const s = useGameStore.getState()
    if (s.commandMode === 'attackMove') {
      s.issueAttackMove(e.point.x, e.point.z)
      return
    }
    s.issueMove(e.point.x, e.point.z)
  }

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={onMove}
        onClick={onClick}
        onContextMenu={onContext}
      >
        <planeGeometry args={[MAP_SIZE, MAP_SIZE]} />
        <meshStandardMaterial color={COLORS.grass} roughness={0.92} metalness={0} />
      </mesh>
      <Grid
        args={[MAP_SIZE, MAP_SIZE]}
        cellSize={1}
        cellThickness={0.4}
        cellColor="#3a6234"
        sectionSize={10}
        sectionThickness={1}
        sectionColor="#2c4f28"
        fadeDistance={140}
        fadeStrength={0.6}
        position={[0, 0.03, 0]}
      />
    </group>
  )
}
