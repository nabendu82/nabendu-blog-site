"use client";

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { DataTexture, RGBAFormat, SRGBColorSpace, RepeatWrapping, LinearFilter, LinearMipmapLinearFilter, Shape, DoubleSide, type Group } from 'three'
import type { Civilization } from '../../game/types'

type Surface = 'stone' | 'plaster' | 'roof' | 'wood'
const textures = new Map<Surface, DataTexture>()
/** Small, deterministic, shared surface maps; no network assets or per-frame allocations. */
function surfaceMap(kind: Surface) {
  const cached = textures.get(kind)
  if (cached) return cached
  const size = 128
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const noise = ((x * 73 + y * 151 + x * y * 17) % 23) - 11
    const row = Math.floor(y / 16)
    const seam = kind === 'stone' ? y % 16 < 2 || (x + row % 2 * 16) % 32 < 2
      : kind === 'roof' ? y % 16 < 2 || (x + row % 2 * 8) % 16 < 1
      : kind === 'wood' ? x % 32 < 2 : false
    const grain = kind === 'wood' ? Math.sin(x * 1.6 + Math.sin(y * 0.09)) * 17 : 0
    const value = Math.max(0, Math.min(255, (seam ? 135 : 233) + noise + grain))
    const i = (y * size + x) * 4
    data[i] = data[i + 1] = data[i + 2] = value
    data[i + 3] = 255
  }
  const map = new DataTexture(data, size, size, RGBAFormat)
  map.colorSpace = SRGBColorSpace
  map.wrapS = map.wrapT = RepeatWrapping
  if (kind === 'stone' || kind === 'roof') map.repeat.set(2, 2)
  map.magFilter = LinearFilter
  map.minFilter = LinearMipmapLinearFilter
  map.generateMipmaps = true
  map.needsUpdate = true
  textures.set(kind, map)
  return map
}

export function SurfaceMaterial({ color, surface = 'stone' }: { color: string; surface?: Surface }) {
  const map = useMemo(() => surfaceMap(surface), [surface])
  return <meshStandardMaterial color={color} map={map} roughness={surface === 'roof' ? 0.76 : 0.92} />
}

export function Block({ at = [0, 0, 0], size, color, surface, rotation }: {
  at?: [number, number, number]; size: [number, number, number]; color: string
  surface?: Surface; rotation?: [number, number, number]
}) {
  return <mesh position={at} rotation={rotation} castShadow receiveShadow>
    <boxGeometry args={size} />
    {surface ? <SurfaceMaterial color={color} surface={surface} /> : <meshStandardMaterial color={color} roughness={0.8} />}
  </mesh>
}

export const palettes: Record<Civilization, { wall: string; trim: string; roof: string; wood: string }> = {
  indian: { wall: '#d8bc8b', trim: '#eee0bc', roof: '#956047', wood: '#57402b' },
  british: { wall: '#a26953', trim: '#e2d4b7', roof: '#4f5960', wood: '#44372c' },
  japanese: { wall: '#dfd5b9', trim: '#604838', roof: '#49575a', wood: '#44382c' },
  french: { wall: '#ddd2b5', trim: '#f2e5c8', roof: '#46556a', wood: '#554335' },
}

/** Two pitched roof planes with ridge cap and substantial overhanging eaves. */
export function Roof({ width, depth, y, color, japanese = false }: {
  width: number; depth: number; y: number; color: string; japanese?: boolean
}) {
  const rise = depth * (japanese ? 0.24 : 0.37)
  const run = depth / 2 + 0.16
  const slope = Math.atan2(rise, run)
  const length = Math.hypot(run, rise)
  const gable = useMemo(() => {
    const shape = new Shape()
    shape.moveTo(-depth / 2, 0)
    shape.lineTo(depth / 2, 0)
    shape.lineTo(0, rise * (depth / 2) / run)
    shape.closePath()
    return shape
  }, [depth, rise, run])
  return <group>
    {[-1, 1].map(side => <group key={side}>
      <Block at={[0, y + rise / 2, side * run / 2]} size={[width + 0.38, 0.12, length + 0.08]} rotation={[side * slope, 0, 0]} color={color} surface="roof" />
      <Block at={[0, y - 0.02, side * run]} size={[width + 0.44, 0.13, 0.13]} color="#504333" />
      {japanese && <Block at={[0, y + 0.05, side * (run + 0.12)]} size={[width + 0.65, 0.1, 0.3]} rotation={[-side * 0.25, 0, 0]} color={color} />}
    </group>)}
    <Block at={[0, y + rise + 0.08, 0]} size={[width + 0.42, 0.15, 0.18]} color={color} surface="roof" />
    {/* Inset gable fills prevent open gaps beneath the pitched roof. */}
    {[-1, 1].map(side => <mesh key={side} position={[side * width / 2, y, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
      <shapeGeometry args={[gable]} />
      <meshStandardMaterial color="#776650" roughness={0.95} side={DoubleSide} />
    </mesh>)}
  </group>
}

export function WindowFrame({ x, y, z, trim, shutter, door = false, arched = false }: {
  x: number; y: number; z: number; trim: string; shutter: string; door?: boolean; arched?: boolean
}) {
  const w = door ? 0.59 : 0.4
  const h = door ? 0.95 : 0.5
  const arch = useMemo(() => {
    const shape = new Shape()
    shape.moveTo(-w / 2, -h / 2)
    shape.lineTo(w / 2, -h / 2)
    shape.lineTo(w / 2, h / 2 - w / 2)
    shape.absarc(0, h / 2 - w / 2, w / 2, 0, Math.PI, false)
    shape.closePath()
    return shape
  }, [w, h])
  return <group position={[x, y, z]}>
    <Block size={[w + 0.13, h + 0.13, 0.09]} color={trim} />
    {arched ? <mesh position={[0, 0, 0.077]}><shapeGeometry args={[arch]} /><meshStandardMaterial color={door ? '#473225' : '#253a3d'} roughness={0.9} /></mesh>
      : <Block at={[0, 0, 0.055]} size={[w, h, 0.04]} color={door ? '#473225' : '#253a3d'} surface={door ? 'wood' : undefined} />}
    <Block at={[0, 0, 0.085]} size={[0.025, arched ? h - 0.1 : h, 0.025]} color={trim} />
    {!door && <>
      <Block at={[0, 0, 0.085]} size={[w, 0.025, 0.025]} color={trim} />
      {[-1, 1].map(s => <Block key={s} at={[s * (w / 2 + 0.11), 0, 0.035]} size={[0.15, h, 0.05]} color={shutter} surface="wood" />)}
      <Block at={[0, -h / 2 - 0.07, 0.08]} size={[w + 0.3, 0.07, 0.18]} color={trim} />
    </>}
    {door && <Block at={[0.15, -0.08, 0.095]} size={[0.04, 0.07, 0.03]} color="#bd9854" />}
  </group>
}

export function Banner({ at, color }: { at: [number, number, number]; color: string }) {
  return <group position={at}>
    <Block at={[0, 0.45, 0]} size={[0.045, 0.9, 0.045]} color="#66523a" />
    <mesh position={[0.02, 0.91, 0]}><sphereGeometry args={[0.065, 8, 6]} /><meshStandardMaterial color="#c6a562" metalness={0.5} roughness={0.4} /></mesh>
    <Block at={[0.27, 0.67, 0]} size={[0.5, 0.3, 0.025]} color={color} />
    <Block at={[0.27, 0.67, 0.02]} size={[0.05, 0.24, 0.012]} color="#e9d9ac" />
  </group>
}

export function Barrel({ at }: { at: [number, number, number] }) {
  return <group position={at}>
    <mesh position={[0, 0.23, 0]} castShadow><cylinderGeometry args={[0.18, 0.19, 0.46, 10]} /><SurfaceMaterial color="#94714a" surface="wood" /></mesh>
    {[0.09, 0.35].map(y => <mesh key={y} position={[0, y, 0]}><cylinderGeometry args={[0.195, 0.195, 0.035, 10]} /><meshStandardMaterial color="#4b4943" metalness={0.55} roughness={0.6} /></mesh>)}
  </group>
}

export function Dome({ at, radius, color }: { at: [number, number, number]; radius: number; color: string }) {
  return <group position={at}>
    <mesh castShadow><cylinderGeometry args={[radius, radius * 1.08, 0.18, 20]} /><SurfaceMaterial color="#e4cfaa" /></mesh>
    <mesh position={[0, 0.05, 0]} scale={[1, 1.18, 1]} castShadow><sphereGeometry args={[radius, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={color} roughness={0.62} metalness={0.12} /></mesh>
    <mesh position={[0, radius * 1.18 + 0.17, 0]} castShadow><coneGeometry args={[0.09, 0.35, 10]} /><meshStandardMaterial color="#c6a259" metalness={0.65} roughness={0.4} /></mesh>
  </group>
}

export function MillSails({ at }: { at: [number, number, number] }) {
  const rotor = useRef<Group>(null)
  useFrame((_, dt) => { if (rotor.current) rotor.current.rotation.z += dt * 0.35 })
  return <group position={at}><group ref={rotor}>
    {[0, 1, 2, 3].map(i => <group key={i} rotation={[0, 0, i * Math.PI / 2]}>
      <Block at={[0, 0.65, 0]} size={[0.065, 1.5, 0.07]} color="#665239" />
      <Block at={[0.16, 0.88, 0.035]} size={[0.3, 0.83, 0.04]} color="#ded2b3" />
      {[0.55, 0.78, 1.02, 1.25].map(y => <Block key={y} at={[0.16, y, 0.065]} size={[0.36, 0.035, 0.03]} color="#8c7553" />)}
    </group>)}
  </group><mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.14, 0.14, 0.18, 12]} /><meshStandardMaterial color="#504338" /></mesh></group>
}
