"use client";

import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import { COLORS } from '../game/constants'
import { inputFlags } from '../game/input'
import { isBuilding, isResource, isUnit, type Entity, type PlacementKind } from '../game/types'
import { hover, isPlacementValid, useGameStore } from '../game/store'
import { BerryBushModel } from './models/BerryBush'
import { GoldMineModel } from './models/GoldMine'
import { HerdModel } from './models/Herd'
import { PalisadeModel } from './models/Palisade'
import { ProjectileModel } from './models/Projectile'
import { RallyFlag } from './models/RallyFlag'
import { SacredFieldModel } from './models/SacredField'
import { AgraFortModel } from './models/AgraFort'
import { TreeModel } from './models/Tree'
import { ToriiShrineModel } from './models/ToriiShrine'
import { ChateauModel } from './models/Chateau'
import { TenshuModel } from './models/Tenshu'
import { AnimatedUnit } from './units/AnimatedUnit'
import { isExplored, isInVision } from '../game/fog'
import { SettlementModel } from './models/Settlement'
import { IndustrialWorkshop, IndustrialFacade } from './models/Industrial'

function GhostOf({ kind }: { kind: NonNullable<PlacementKind> }) {
  const civ = useGameStore(s => s.playerCiv)
  const industrial = useGameStore(s => s.playerAge === 3)
  if (kind === 'factory') return <IndustrialWorkshop civ={civ} color="#4ade80" />
  if (kind === 'townCenter' || kind === 'house' || kind === 'manor' || kind === 'barracks' || kind === 'mill' || kind === 'lumberCamp' || kind === 'miningCamp' || kind === 'foundry' || kind === 'caravanserai') {
    return <SettlementModel kind={kind} civ={civ} color="#4ade80" industrial={industrial} />
  }
  switch (kind) {
    case 'sacredField':
      return <SacredFieldModel color="#4ade80" />
    case 'farm':
      return <SacredFieldModel color="#4ade80" />
    case 'toriiShrine':
      return <ToriiShrineModel color="#4ade80" />
    case 'chateau':
      return <ChateauModel color="#4ade80" />
    case 'tenshu':
      return <TenshuModel color="#4ade80" />
    case 'palisade':
      return <PalisadeModel color="#4ade80" />
    case 'agraFort':
      return <AgraFortModel color="#4ade80" />
    default:
      return null
  }
}

function ModelOf({ entity }: { entity: Entity }) {
  const terrain = useGameStore(s => s.terrain)
  const accent = entity.team === 'enemy' ? COLORS.enemy : COLORS.player
  const civ = useGameStore(s => entity.team === 'enemy' ? s.enemyCiv : s.playerCiv)
  const industrial = useGameStore(s => (entity.team === 'enemy' ? s.enemyAge : s.playerAge) === 3)
  const kind = entity.kind
  if (kind === 'factory') return <IndustrialWorkshop civ={civ} color={accent} />
  if (kind === 'townCenter' || kind === 'house' || kind === 'manor' || kind === 'barracks' || kind === 'mill' || kind === 'lumberCamp' || kind === 'miningCamp' || kind === 'foundry' || kind === 'caravanserai') {
    return <SettlementModel kind={kind} color={accent} civ={civ} industrial={industrial} />
  }
  switch (entity.kind) {
    case 'rocket':
    case 'heavyCannon':
    case 'flamingArrow':
    case 'royalElephant':
    case 'villager':
    case 'sepoy':
    case 'rajput':
    case 'sowar':
    case 'gurkha':
    case 'mahout':
    case 'siegeElephant':
    case 'pikeman':
    case 'longbowman':
    case 'redcoat':
    case 'hussar':
    case 'dragoon':
    case 'falconet':
    case 'samurai':
    case 'yumiArcher':
    case 'ashigaru':
    case 'naginata':
    case 'crossbowman':
    case 'halberdier':
    case 'cuirassier':
      return <AnimatedUnit id={entity.id} kind={entity.kind} />
    case 'sacredField':
      return <SacredFieldModel color={accent} />
    case 'farm':
      return <SacredFieldModel color={accent} />
    case 'toriiShrine':
      return <ToriiShrineModel color={accent} />
    case 'chateau':
      return <group><ChateauModel color={accent} />{industrial && <IndustrialFacade civ={civ} color={accent} width={2.4} depth={1.8} height={1.4} />}</group>
    case 'tenshu':
      return <group><TenshuModel color={accent} />{industrial && <group position={[0, 0.9, 0]}><IndustrialFacade civ={civ} color={accent} width={2} depth={2} height={0.7} /></group>}</group>
    case 'palisade':
      return <PalisadeModel color={accent} />
    case 'agraFort':
      return <group><AgraFortModel color={accent} />{industrial && <IndustrialFacade civ={civ} color={accent} width={2.8} depth={2.8} height={1.2} />}</group>
    case 'tree':
      return <TreeModel scale={entity.scale} palm={terrain === 'oasis'} />
    case 'berryBush':
      return <BerryBushModel scale={entity.scale} />
    case 'goldMine':
      return <GoldMineModel scale={entity.scale} />
    case 'herd':
      return <HerdModel scale={entity.scale} />
    case 'projectile':
      return (
        <group scale={entity.splash > 0 ? 2.6 : 1}>
          <ProjectileModel />
        </group>
      )
    default:
      return null
  }
}

function barHeight(e: Entity): number {
  if (e.kind === 'factory') return 4.9
  if (e.kind === 'royalElephant') return 3
  if (e.kind === 'townCenter' || e.kind === 'agraFort' || e.kind === 'tenshu' || e.kind === 'chateau') return 3.6
  if (e.kind === 'caravanserai' || e.kind === 'foundry' || e.kind === 'barracks') return 2.4
  if (e.kind === 'house' || e.kind === 'mill' || e.kind === 'manor' || e.kind === 'toriiShrine') return 2.1
  if (e.kind === 'lumberCamp' || e.kind === 'miningCamp') return 1.9
  if (e.kind === 'palisade') return 1.7
  if (e.kind === 'sacredField' || e.kind === 'farm' || e.kind === 'projectile' || isResource(e)) return 0
  if (e.kind === 'mahout' || e.kind === 'siegeElephant') return 2.85
  if (
    e.kind === 'sowar' ||
    e.kind === 'hussar' ||
    e.kind === 'dragoon' ||
    e.kind === 'naginata' ||
    e.kind === 'cuirassier'
  ) {
    return 2.2
  }
  if (e.kind === 'falconet') return 1.8
  if (isUnit(e)) return 1.85
  return 1.45
}

function EntityInstance({ id }: { id: string }) {
  const group = useRef<Group>(null)
  const fill = useRef<Mesh>(null)
  const bar = useRef<Group>(null)
  const ring = useRef<Mesh>(null)
  const camera = useThree((s) => s.camera)
  const snapshot = useMemo(() => useGameStore.getState().entities[id], [id])

  useFrame(() => {
    const e = useGameStore.getState().entities[id]
    const g = group.current
    if (!e || !g) return
    g.position.set(e.x, e.y, e.z)
    g.rotation.y = e.facing
    const buildScale = isBuilding(e) ? 0.45 + 0.55 * e.buildProgress : 1
    g.scale.setScalar(e.scale * buildScale)

    if (e.team === 'player') {
      g.visible = true
    } else if (e.kind === 'projectile') {
      g.visible = isInVision(e.x, e.z)
    } else if (e.team === 'enemy' && isUnit(e)) {
      g.visible = isInVision(e.x, e.z)
    } else if (e.team === 'enemy') {
      g.visible = isExplored(e.x, e.z)
    } else {
      g.visible = isExplored(e.x, e.z)
    }

    if (ring.current) {
      ring.current.visible = useGameStore.getState().selectedIds.includes(id) && !e.dying
    }

    const h = barHeight(e)
    if (bar.current) {
      const show = h > 0 && e.hp < e.maxHp && !e.dying
      bar.current.visible = show
      if (show) {
        bar.current.position.set(0, h / Math.max(e.scale * buildScale, 0.05), 0)
        bar.current.lookAt(camera.position)
        const ratio = Math.max(0, e.hp / e.maxHp)
        if (fill.current) {
          fill.current.scale.x = ratio
          fill.current.position.x = (ratio - 1) * 0.55
        }
      }
    }
  })

  if (!snapshot) return null

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (inputFlags.skipClick) return
    const s = useGameStore.getState()
    const ent = s.entities[id]
    // If player already has units selected and clicks an enemy, issue an attack order!
    const hasPlayerUnitsSelected = s.selectedIds.some(
      (sid) => s.entities[sid]?.team === 'player' && isUnit(s.entities[sid]),
    )
    if (
      !e.nativeEvent.shiftKey &&
      hasPlayerUnitsSelected &&
      ent &&
      ent.team === 'enemy' &&
      (isUnit(ent) || isBuilding(ent))
    ) {
      s.issueEntityOrder(id)
      return
    }
    // If attack-move command mode is active, issue attack order on this entity
    if (s.commandMode === 'attackMove' && ent) {
      s.issueEntityOrder(id)
      return
    }
    s.select(id, e.nativeEvent.shiftKey)
  }

  const onContext = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    e.nativeEvent.preventDefault()
    useGameStore.getState().issueEntityOrder(id)
  }

  const interactive = snapshot.kind !== 'projectile'
  const isLargeFort = snapshot.kind === 'agraFort' || snapshot.kind === 'tenshu' || snapshot.kind === 'chateau'
  const pickH = isLargeFort ? 3.6 : isBuilding(snapshot) ? 2.4 : 1.6
  const pickY = isLargeFort ? 1.6 : isBuilding(snapshot) ? 1.0 : 0.6

  return (
    <group
      ref={group}
      position={[snapshot.x, snapshot.y, snapshot.z]}
      onClick={interactive ? onClick : undefined}
      onContextMenu={interactive ? onContext : undefined}
    >
      <ModelOf entity={snapshot} />
      {interactive ? (
        <mesh position={[0, pickY, 0]}>
          <cylinderGeometry
            args={[
              snapshot.radius + (isResource(snapshot) ? 0.55 : 0.45),
              snapshot.radius + (isResource(snapshot) ? 0.55 : 0.45),
              pickH,
              8,
            ]}
          />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}
      {isUnit(snapshot) ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} renderOrder={2}>
          <circleGeometry args={[snapshot.radius + 0.18, 16]} />
          <meshBasicMaterial
            color="#0f172a"
            transparent
            opacity={0.28}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ) : null}
      {isUnit(snapshot) || isBuilding(snapshot) ? (
        <mesh
          ref={ring}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.07, 0]}
          visible={false}
          renderOrder={3}
        >
          <ringGeometry args={[snapshot.radius + 0.18, snapshot.radius + 0.38, 24]} />
          <meshBasicMaterial color="#fde68a" transparent opacity={0.95} depthWrite={false} />
        </mesh>
      ) : null}
      <group ref={bar} visible={false}>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[1.1, 0.14]} />
          <meshBasicMaterial color="#1c1917" />
        </mesh>
        <mesh ref={fill} position={[0, 0, 0.01]}>
          <planeGeometry args={[1.1, 0.1]} />
          <meshBasicMaterial color={snapshot.team === 'enemy' ? '#ef4444' : '#4ade80'} />
        </mesh>
      </group>
    </group>
  )
}

function PlacementGhost() {
  const group = useRef<Group>(null)
  const kind = useGameStore((s) => s.placementKind)

  useFrame(() => {
    const g = group.current
    if (!g || !kind) return
    g.position.set(hover.x, 0, hover.z)
    const valid = isPlacementValid(hover.x, hover.z, kind)
    g.traverse((obj) => {
      const mesh = obj as Mesh
      if (mesh.isMesh && mesh.material && !Array.isArray(mesh.material)) {
        const mat = mesh.material as { color?: { set: (c: string) => void }; opacity?: number; transparent?: boolean }
        if (mat.opacity !== undefined) {
          mat.transparent = true
          mat.opacity = 0.55
        }
        mat.color?.set(valid ? '#4ade80' : '#ef4444')
      }
    })
  })

  if (!kind) return null

  return (
    <group ref={group}>
      <GhostOf kind={kind} />
    </group>
  )
}

function RallyMarkers() {
  const group = useRef<Group>(null)

  useFrame(() => {
    const root = group.current
    if (!root) return
    const s = useGameStore.getState()
    const selected = new Set(s.selectedIds)
    let i = 0
    for (const e of Object.values(s.entities)) {
      if (!e.hasRally || e.dying || e.team !== 'player') continue
      if (!selected.has(e.id)) continue
      let child = root.children[i] as Group | undefined
      if (!child) {
        break
      }
      child.visible = true
      child.position.set(e.rallyX, 0, e.rallyZ)
      i += 1
    }
    for (let k = i; k < root.children.length; k += 1) {
      root.children[k].visible = false
    }
  })

  return (
    <group ref={group}>
      {Array.from({ length: 8 }).map((_, i) => (
        <group key={i} visible={false}>
          <RallyFlag />
        </group>
      ))}
    </group>
  )
}

export function EntityMeshes() {
  const ids = useGameStore((s) => s.entityIds)
  const matchId = useGameStore((s) => s.matchId)
  return (
    <group>
      {ids.map((id) => (
        <EntityInstance key={`${matchId}-${id}`} id={id} />
      ))}
      <PlacementGhost />
      <RallyMarkers />
    </group>
  )
}
