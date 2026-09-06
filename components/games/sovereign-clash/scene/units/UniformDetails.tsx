"use client";

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, type Group } from 'three'
import type { Civilization } from '../../game/types'

function Detail({ at, size, color, rotation, metal = false }: { at: [number, number, number]; size: [number, number, number]; color: string; rotation?: [number, number, number]; metal?: boolean }) {
  return <mesh position={at} rotation={rotation} castShadow><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={metal ? 0.38 : 0.85} metalness={metal ? 0.65 : 0} /></mesh>
}

/** Tailoring and equipment attached to the animated torso, not the world transform. */
export function UniformDetails({ civilian, armored, japanese, color, musket, industrial = false }: { civilian: boolean; armored: boolean; japanese: boolean; color: string; musket: boolean; industrial?: boolean }) {
  const brass = '#b89b62'
  const detail = useRef<Group>(null)
  const position = useRef(new Vector3())
  useFrame(({ camera }) => {
    if (!detail.current) return
    detail.current.getWorldPosition(position.current)
    detail.current.visible = camera.position.distanceToSquared(position.current) < 1600
  })
  return <group ref={detail}>
    {industrial && <>
      <Detail at={[0, 0.2, -0.16]} size={[0.26, 0.4, 0.06]} color={civilian ? '#594433' : japanese ? '#292d32' : color} />
      {!civilian && <>
        {[-1, 1].map(side => <group key={side}>
          <Detail at={[side * 0.17, 0.34, 0]} size={[0.13, 0.07, 0.21]} color={japanese ? '#343b3d' : '#c9a74f'} metal />
          {[0, 1, 2].map(i => <Detail key={i} at={[side * 0.21, 0.3, -0.06 + i * 0.06]} size={[0.022, 0.09, 0.018]} color={japanese ? '#a58b54' : '#d3b969'} metal />)}
          <Detail at={[side * 0.075, 0.24, 0.175]} size={[0.05, 0.22, 0.025]} color={japanese ? '#b99c57' : '#e3d5b1'} />
        </group>)}
        <Detail at={[0.07, 0.26, 0.198]} size={[0.038, 0.055, 0.01]} color="#d7b45d" metal />
        <Detail at={[0, -0.13, -0.12]} size={[0.24, 0.28, 0.07]} color={color} />
      </>}
    </>}
    {/* Waist belt, buckle, shoulder straps and cartridge pouch. */}
    <Detail at={[0, 0.05, 0.11]} size={[0.25, 0.055, 0.04]} color="#4a3528" />
    <Detail at={[0, 0.05, 0.137]} size={[0.048, 0.044, 0.014]} color={brass} metal />
    <Detail at={[0, 0.22, 0.135]} size={[0.032, 0.32, 0.025]} rotation={[0, 0, -0.48]} color={civilian ? '#795a3a' : '#e0d5b9'} />
    {musket && <Detail at={[0, 0.22, 0.142]} size={[0.032, 0.32, 0.022]} rotation={[0, 0, 0.48]} color="#e0d5b9" />}
    <Detail at={[0.145, 0.035, -0.015]} size={[0.095, 0.11, 0.065]} color="#3e3028" />
    {!civilian && <>
      <Detail at={[0, 0.36, 0.025]} size={[0.18, 0.06, 0.15]} color={color} />
      {[-1, 1].map(side => <Detail key={side} at={[side * 0.15, 0.325, 0]} size={[0.105, 0.035, 0.18]} color={armored ? '#777e7a' : brass} metal={armored} />)}
      {[0.12, 0.2, 0.28].map(y => <Detail key={y} at={[0, y, 0.16]} size={[0.021, 0.022, 0.012]} color={brass} metal />)}
      {/* Split tunic skirts produce a readable silhouette even at RTS distance. */}
      {[-1, 1].map(side => <Detail key={side} at={[side * 0.072, -0.07, -0.015]} size={[0.13, 0.2, 0.21]} rotation={[0, 0, side * 0.06]} color={japanese ? '#333b3c' : color} />)}
    </>}
    {civilian && <Detail at={[0, -0.06, 0.12]} size={[0.21, 0.24, 0.025]} color="#b4a086" />}
    {armored && japanese && [0.1, 0.17, 0.24, 0.31].map(y => <Detail key={y} at={[0, y, 0.15]} size={[0.23, 0.052, 0.045]} color={y === 0.17 ? color : '#39403d'} metal />)}
    {musket && <group>
      <Detail at={[0, 0.18, -0.145]} size={[0.2, 0.23, 0.09]} color="#61503c" />
      <mesh position={[0, 0.33, -0.16]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.055, 0.055, 0.26, 8]} /><meshStandardMaterial color="#a89e85" roughness={0.95} /></mesh>
    </group>}
  </group>
}

export function HistoricalHat({ style, color, civ }: { style: 'shako' | 'turban' | 'tricorn'; color: string; civ: Civilization }) {
  return <group>
    {style === 'shako' ? <>
      <mesh position={[0, 0.18, 0]} castShadow><cylinderGeometry args={[0.104, 0.116, 0.22, 12]} /><meshStandardMaterial color="#292c2c" roughness={0.85} /></mesh>
      <Detail at={[0, 0.075, 0.085]} size={[0.22, 0.028, 0.12]} color="#242828" />
      <Detail at={[0, 0.14, 0.109]} size={[0.045, 0.066, 0.012]} color="#c0a16a" metal />
      <mesh position={[-0.065, 0.32, 0]} scale={[0.6, 1.5, 0.6]}><sphereGeometry args={[0.04, 8, 8]} /><meshStandardMaterial color={color} /></mesh>
    </> : style === 'tricorn' ? <>
      <mesh position={[0, 0.1, 0]} castShadow><cylinderGeometry args={[0.105, 0.12, 0.1, 10]} /><meshStandardMaterial color="#3b352d" /></mesh>
      <mesh position={[0, 0.065, 0]} rotation={[0, Math.PI / 3, 0]} castShadow><cylinderGeometry args={[0.21, 0.21, 0.055, 3]} /><meshStandardMaterial color="#38342d" /></mesh>
      <Detail at={[0, 0.095, 0.14]} size={[0.045, 0.025, 0.02]} color={color} />
    </> : <>
      {[0, 1, 2].map(i => <mesh key={i} position={[0, 0.08 + i * 0.034, 0]} rotation={[Math.PI / 2 + 0.1, i * 0.13, 0]} scale={[1, 0.93, 1]} castShadow><torusGeometry args={[0.096 - i * 0.008, 0.035, 6, 14]} /><meshStandardMaterial color={civ === 'indian' ? '#ddceb0' : color} roughness={0.95} /></mesh>)}
      <Detail at={[0.085, -0.03, -0.06]} size={[0.055, 0.22, 0.04]} color="#d7c5a3" />
      <Detail at={[0, 0.15, 0.1]} size={[0.025, 0.05, 0.02]} color="#b7985f" metal />
    </>}
  </group>
}
