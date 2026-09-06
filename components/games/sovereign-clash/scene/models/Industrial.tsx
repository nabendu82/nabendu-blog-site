"use client";

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { Civilization } from '../../game/types'
import { useGameStore } from '../../game/store'
import { Banner, Barrel, Block, Dome, palettes, Roof, WindowFrame } from './Architecture'

/** Each arsenal uses its civilization's masonry, roof profile and ornament. */
export function IndustrialWorkshop({ civ, color }: { civ: Civilization; color: string }) {
  const p = palettes[civ]
  const eastern = civ === 'indian' || civ === 'japanese'
  const smoke = useRef<Group>(null)
  useFrame(({ clock }) => {
    smoke.current?.children.forEach((puff, i) => {
      const phase = (clock.elapsedTime * 0.3 + i / 4) % 1
      puff.position.set(Math.sin(phase * 4) * 0.25, phase * 1.8, phase * 0.3)
      puff.scale.setScalar(0.12 + phase * 0.32)
    })
  })
  return <group>
    <Block at={[0, 0.12, 0]} size={[4.25, 0.24, 3.5]} color="#8c887a" surface="stone" />
    <Block at={[0, 1.1, 0]} size={[3.8, 1.95, 2.9]} color={p.wall} surface="stone" />
    <Roof width={4.15} depth={3.25} y={2.12} color={p.roof} japanese={civ === 'japanese'} />
    {[-1, 1].map(s => <group key={s}>
      <Block at={[s * 1.82, 1.1, 1.49]} size={[0.17, 2.05, 0.16]} color={p.trim} surface="stone" />
      <WindowFrame x={s * 1.18} y={1.3} z={1.48} trim={p.trim} shutter={color} arched={civ === 'indian'} />
      <Block at={[s * 0.53, 0.7, 1.49]} size={[0.06, 1.35, 0.08]} color="#343b3e" />
    </group>)}
    <Block at={[0, 0.73, 1.49]} size={[1, 1.35, 0.09]} color={p.wood} surface="wood" />
    {[-0.34, 0.34].map(x => <Block key={x} at={[x, 0.73, 1.56]} size={[0.06, 1.3, 0.035]} color="#777b78" />)}
    <Block at={[0, 1.8, 1.52]} size={[1.2, 0.22, 0.12]} color={color} />
    <Block at={[-1.28, 2.4, -0.8]} size={[0.52, 4.6, 0.52]} color={eastern ? '#837665' : '#805245'} surface="stone" />
    {[3.3, 4.45, 4.65].map(y => <Block key={y} at={[-1.28, y, -0.8]} size={[0.65, 0.14, 0.65]} color={p.trim} surface="stone" />)}
    <group position={[-1.28, 4.75, -0.8]} ref={smoke}>{[0, 1, 2, 3].map(i => <mesh key={i}><icosahedronGeometry args={[1, 1]} /><meshStandardMaterial color="#a4a39b" transparent opacity={0.22} depthWrite={false} /></mesh>)}</group>
    {civ === 'indian' && <Dome at={[1.15, 2.65, -0.35]} radius={0.52} color="#c8a366" />}
    <Banner at={[1.65, 2.25, 1.1]} color={color} />
    <Barrel at={[-1.6, 0.2, 1.52]} />
    <Block at={[1.35, 0.4, 1.52]} size={[0.65, 0.5, 0.5]} color={p.wood} surface="wood" />
    {[0, 1, 2].map(i => <mesh key={i} position={[0.95 + i * 0.2, 0.22, 1.65]} castShadow><sphereGeometry args={[0.12, 10, 8]} /><meshStandardMaterial color="#343b40" metalness={0.7} roughness={0.45} /></mesh>)}
  </group>
}

/** Visible reinforced foundations, cornices, pilasters and gilded roof crests. */
export function IndustrialFacade({ civ, color, width, depth, height }: { civ: Civilization; color: string; width: number; depth: number; height: number }) {
  const p = palettes[civ]
  return <group>
    <Block at={[0, 0.22, 0]} size={[width + 0.12, 0.28, depth + 0.12]} color={p.trim} surface="stone" />
    <Block at={[0, height + 0.22, depth / 2 + 0.09]} size={[width + 0.14, 0.17, 0.14]} color={civ === 'japanese' ? '#ac8a49' : p.trim} />
    {[-1, 1].map(s => <group key={s}>
      <Block at={[s * (width / 2 - 0.17), height / 2 + 0.18, depth / 2 + 0.1]} size={[0.16, height, 0.15]} color={civ === 'japanese' ? '#472d27' : p.trim} surface="stone" />
      <Block at={[s * (width / 2 - 0.17), height + 0.22, depth / 2 + 0.1]} size={[0.25, 0.16, 0.23]} color="#b99a58" />
    </group>)}
    <Block at={[0, height + 0.22, depth / 2 + 0.18]} size={[0.4, 0.25, 0.04]} color={color} />
    <mesh position={[0, height + 0.24, depth / 2 + 0.21]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.075, 0.018, 6, 12]} /><meshStandardMaterial color="#d1af65" metalness={0.65} roughness={0.35} /></mesh>
  </group>
}

export function RocketCarriage({ id, japanese = false }: { id: string; japanese?: boolean }) {
  // The parent unit owns movement and facing; wheel and recoil animation follows live simulation.
  const rack = useRef<Group>(null)
  const wheels = useRef<Group>(null)
  const previous = useRef<{ x: number; z: number } | null>(null)
  useFrame(() => {
    const e = useGameStore.getState().entities[id]
    if (!e) return
    const distance = previous.current ? Math.hypot(e.x - previous.current.x, e.z - previous.current.z) : 0
    previous.current = { x: e.x, z: e.z }
    wheels.current?.children.forEach(w => { w.rotation.x += distance / 0.34 })
    if (rack.current) rack.current.position.z = -Math.max(0, e.attackTimer - 1.2) * 0.15
  })
  return <group>
    <Block at={[0, 0.4, -0.1]} size={[0.72, 0.17, 1.35]} color={japanese ? '#743e2d' : '#4b6256'} surface="wood" />
    <group ref={wheels}>{[-1, 1].map(s => <group key={s} position={[s * 0.48, 0.35, 0]}>
      <mesh rotation={[0, Math.PI / 2, 0]} castShadow><torusGeometry args={[0.31, 0.045, 6, 16]} /><meshStandardMaterial color="#393d3e" metalness={0.6} roughness={0.45} /></mesh>
      {[0, 1, 2, 3].map(i => <Block key={i} size={[0.06, 0.6, 0.045]} rotation={[i * Math.PI / 4, 0, 0]} color="#a78a59" />)}
    </group>)}</group>
    <Block at={[0, 0.72, -0.14]} size={[0.1, 0.6, 0.1]} color="#3c4140" />
    <group ref={rack}><group position={[0, 0.86, 0.04]} rotation={[-0.35, 0, 0]}>
      <Block size={[0.8, 0.1, 1.1]} color={japanese ? '#8a3829' : '#596959'} surface="wood" />
      {[-0.26, 0, 0.26].map(x => <group key={x} position={[x, 0.11, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.055, 0.055, 0.82, 10]} /><meshStandardMaterial color={japanese ? '#b7853c' : '#444b4e'} metalness={0.6} roughness={0.38} /></mesh>
        <mesh position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.065, 0.2, 10]} /><meshStandardMaterial color="#b29d70" metalness={0.6} roughness={0.4} /></mesh>
        <Block at={[0, 0, -0.55]} size={[0.025, 0.025, 0.5]} color="#b99b62" />
      </group>)}
    </group></group>
  </group>
}
