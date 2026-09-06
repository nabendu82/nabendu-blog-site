"use client";

import type { Civilization } from '../../game/types'
import { Banner, Barrel, Block, Dome, MillSails, palettes, Roof, SurfaceMaterial, WindowFrame } from './Architecture'

export type SettlementKind = 'townCenter' | 'house' | 'manor' | 'barracks' | 'mill' | 'lumberCamp' | 'miningCamp' | 'foundry' | 'caravanserai'

/** Original historical architecture, kept inside the existing gameplay footprints. */
export function SettlementModel({ kind, color = '#2f6fb8', civ = 'indian' }: {
  kind: SettlementKind; color?: string; civ?: Civilization
}) {
  const p = palettes[civ]
  const town = kind === 'townCenter'
  const manor = kind === 'manor'
  const military = kind === 'barracks'
  const foundry = kind === 'foundry'
  const stable = kind === 'caravanserai'
  const mill = kind === 'mill'
  const camp = kind === 'lumberCamp' || kind === 'miningCamp'
  const japanese = civ === 'japanese'
  const indian = civ === 'indian'
  const w = town ? 3.5 : manor ? 2.8 : military ? 3.4 : stable ? 3.5 : foundry ? 3 : camp ? 2.3 : mill ? 1.6 : 1.85
  const d = town ? 2.65 : military ? 2.35 : stable ? 3 : manor ? 2.1 : foundry ? 2.4 : 1.6
  const h = town ? 1.95 : manor ? 1.65 : military ? 1.45 : camp ? 1.1 : mill ? 1.75 : 1.25
  const front = d / 2 + 0.04
  return <group>
    <Block at={[0, 0.09, 0]} size={[w + 0.35, 0.18, d + 0.35]} color="#988b72" surface="stone" />
    <Block at={[0, h / 2 + 0.18, 0]} size={[w, h, d]} color={p.wall} surface={indian || japanese ? 'plaster' : 'stone'} />
    <Block at={[0, 0.28, 0]} size={[w + 0.06, 0.2, d + 0.06]} color={p.trim} surface="stone" />
    <Block at={[0, h + 0.13, 0]} size={[w + 0.15, 0.14, d + 0.15]} color={p.trim} />
    {[-1, 1].map(s => <group key={s}>
      <Block at={[s * (w / 2 - 0.065), h / 2 + 0.18, front]} size={[0.15, h, 0.12]} color={japanese ? p.wood : p.trim} surface="stone" />
      <group position={[s * (w / 2 + 0.04), 0, 0]} rotation={[0, s * Math.PI / 2, 0]}>
        <WindowFrame arched={indian} x={0} y={0.96} z={0} trim={p.trim} shutter={color} />
      </group>
    </group>)}
    <WindowFrame arched={indian} x={0} y={0.7} z={front} trim={p.trim} shutter={color} door />
    {w > 2.5 && [-1, 1].map(s => <WindowFrame arched={indian} key={s} x={s * w * 0.3} y={1.0} z={front} trim={p.trim} shutter={color} />)}
    {w <= 2.5 && <WindowFrame arched={indian} x={-0.59} y={0.92} z={front} trim={p.trim} shutter={color} />}
    {town && [-1, 0, 1].map(i => <WindowFrame arched={indian} key={i} x={i * 1.05} y={1.8} z={front} trim={p.trim} shutter={color} />)}
    {/* Recessed doorway and broad stone steps anchor the structure to its plot. */}
    {[0, 1].map(i => <Block key={i} at={[0, 0.065 + i * 0.075, front + 0.34 - i * 0.1]} size={[0.95 - i * 0.08, 0.13, 0.48 - i * 0.1]} color={p.trim} surface="stone" />)}

    {town && indian ? <>
      <Block at={[0, h + 0.23, 0]} size={[w + 0.3, 0.22, d + 0.3]} color={p.trim} />
      <Dome at={[0, h + 0.45, 0]} radius={0.95} color="#b9c4aa" />
      {[-1, 1].map(x => <group key={x} position={[x * 1.4, h + 0.27, 0]}>
        {[-1, 1].map(z => <group key={z} position={[0, 0, z * 0.94]}>
          <Block at={[0, 0.29, 0]} size={[0.38, 0.57, 0.38]} color={p.wall} surface="stone" />
          <Dome at={[0, 0.62, 0]} radius={0.28} color={p.roof} />
        </group>)}
      </group>)}
    </> : <Roof width={w} depth={d} y={h + 0.23} color={p.roof} japanese={japanese} />}

    {town && !indian && <group position={[0, h + 0.75, 0]}>
      <Block at={[0, 0.37, 0]} size={[0.8, 0.75, 0.75]} color={p.wall} surface="plaster" />
      <WindowFrame arched={indian} x={0} y={0.43} z={0.4} trim={p.trim} shutter={color} />
      <Roof width={0.85} depth={0.8} y={0.79} color={p.roof} japanese={japanese} />
      <Banner at={[0, 1.15, 0]} color={color} />
    </group>}
    {town && indian && <Banner at={[1.35, h + 1.18, -0.9]} color={color} />}
    {!town && !mill && <Banner at={[w / 2 - 0.18, h + 0.4, 0]} color={color} />}

    {(town || manor || stable) && <group>
      <Block at={[0, 1.37, front + 0.32]} size={[w * 0.63, 0.1, 0.75]} color={indian ? '#e4d4a9' : p.roof} surface={indian ? 'plaster' : 'roof'} />
      {[-1, 1].map(s => <Block key={s} at={[s * w * 0.28, 0.77, front + 0.59]} size={[0.09, 1.2, 0.09]} color={p.trim} />)}
    </group>}
    {japanese && <>
      {[-1, 0, 1].map(i => <Block key={i} at={[i * w * 0.43, h / 2 + 0.18, front + 0.03]} size={[0.08, h, 0.08]} color={p.wood} />)}
      <Block at={[0, h * 0.66, front + 0.03]} size={[w, 0.07, 0.07]} color={p.wood} />
    </>}
    {(japanese || camp) && [-1, 0, 1].map(i => <Block key={i} at={[i * w * 0.35, h / 2 + 0.2, -d / 2 - 0.02]} size={[0.09, h, 0.09]} color={p.wood} surface="wood" />)}
    {(manor || foundry || (!indian && kind === 'house')) && <group position={[w * 0.28, h + 0.53, -0.34]}>
      <Block size={[0.33, 1.1, 0.38]} color={foundry ? '#635649' : p.wall} surface="stone" />
      <Block at={[0, 0.58, 0]} size={[0.44, 0.15, 0.48]} color={p.trim} />
      <Block at={[0, 0.665, 0]} size={[0.24, 0.03, 0.27]} color="#302f2a" />
    </group>}
    {mill && <MillSails at={[0, 1.9, front + 0.21]} />}
    {military && <group position={[w / 2 - 0.38, 0.55, front + 0.16]}>
      <Block size={[0.66, 0.07, 0.3]} color={p.wood} />
      {[-0.23, 0, 0.23].map(x => <group key={x} position={[x, 0.26, 0]} rotation={[0, 0, -0.12]}>
        <Block size={[0.045, 0.95, 0.045]} color="#65503b" />
        <mesh position={[0, 0.58, 0]}><coneGeometry args={[0.045, 0.2, 6]} /><meshStandardMaterial color="#a6aaa6" metalness={0.7} roughness={0.4} /></mesh>
      </group>)}
    </group>}
    {kind === 'lumberCamp' && [0, 1, 2].map(i => <mesh key={i} position={[0.57 + i * 0.22, 0.27, front + 0.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.12, 0.12, 0.85, 8]} /><SurfaceMaterial color="#8d6944" surface="wood" />
    </mesh>)}
    {kind === 'miningCamp' && <group position={[0.65, 0.3, front + 0.08]}>
      <Block size={[0.6, 0.35, 0.42]} color="#655442" surface="wood" />
      {[-1, 1].map(s => <mesh key={s} position={[s * 0.35, -0.13, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.16, 0.16, 0.07, 10]} /><meshStandardMaterial color="#383936" /></mesh>)}
      <mesh position={[0, 0.2, 0]}><dodecahedronGeometry args={[0.23, 0]} /><meshStandardMaterial color="#a39b75" roughness={0.85} /></mesh>
    </group>}
    {foundry && <group position={[0.85, 0.42, front + 0.04]}>
      <Block size={[0.6, 0.17, 0.35]} color="#4f5353" />
      <Block at={[0, -0.14, 0]} size={[0.28, 0.25, 0.27]} color="#444644" />
      <Block at={[0.36, 0, 0]} size={[0.18, 0.09, 0.2]} color="#737773" />
    </group>}
    {!mill && <Barrel at={[-w / 2 + 0.18, 0.18, front + 0.13]} />}
    {stable && <Block at={[w / 2 - 0.3, 0.3, front + 0.1]} size={[0.65, 0.3, 0.45]} color="#b5a06a" surface="wood" />}
  </group>
}
