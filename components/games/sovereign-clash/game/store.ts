import { create } from 'zustand'
import {
  AGE_UP_COMMERCE,
  AGE_UP_FORTRESS,
  BUILDING_STATS,
  CAMERA,
  COSTS,
  MAP_HALF,
  PLAYER_BASE,
  TRAIN_TIME,
  GUARD_CAP,
} from './constants'
import { setMuted, startMusic } from './audio'
import { resetFog, tickFog } from './fog'
import {
  createBuilding,
  createUnit,
  generateWorld,
} from './mapGen'
import { dist } from './pathfinding'
import {
  canTrain,
  isBuilding,
  isComplete,
  isDropoff,
  isGatherable,
  isMilitary,
  isUnit,
  requiredAge,
  type Age,
  type BuildingKind,
  type CommandMode,
  type Entity,
  type Formation,
  type HudSlice,
  type PlacementKind,
  type Team,
  type UnitKind,
} from './types'

export const view = {
  targetX: PLAYER_BASE.x,
  targetZ: PLAYER_BASE.z,
  distance: CAMERA.defaultDistance,
}

export const hover = {
  x: 0,
  z: 0,
  hit: false,
}

let hudDirty = true

export function markHud(): void {
  hudDirty = true
}

export function consumeHudDirty(): boolean {
  const d = hudDirty
  hudDirty = false
  return d
}

export interface GameStore extends HudSlice {
  entities: Record<string, Entity>
  nextId: number
  enemyWood: number
  enemyFood: number
  enemyGold: number
  aiTimer: number
  controlGroups: Record<number, string[]>
  manorTimer: number
  barracksRebuildAt: number
  guardCap: number
  select: (id: string | null, additive?: boolean) => void
  selectMany: (ids: string[]) => void
  setPlacement: (kind: PlacementKind) => void
  setCommandMode: (mode: CommandMode) => void
  placeBuilding: (x: number, z: number) => boolean
  issueMove: (x: number, z: number) => void
  issueAttackMove: (x: number, z: number) => void
  issueEntityOrder: (targetId: string) => void
  setRally: (x: number, z: number) => void
  train: (kind: UnitKind) => void
  setControlGroup: (slot: number) => void
  recallControlGroup: (slot: number) => void
  selectIdleVillager: () => void
  openHelp: () => void
  closeHelp: () => void
  startAgeUp: () => void
  setFormation: (mode: Formation) => void
  toggleMute: () => void
  restart: () => void
}

function popCounts(entities: Record<string, Entity>): { pop: number; popCap: number } {
  let pop = 0
  let popCap = 0
  for (const e of Object.values(entities)) {
    if (e.team !== 'player' || e.dying) continue
    if (isUnit(e)) pop += 1
    if (isBuilding(e) && isComplete(e)) popCap += BUILDING_STATS[e.kind as BuildingKind].pop
  }
  return { pop, popCap }
}

function hudFrom(s: {
  entities: Record<string, Entity>
  wood: number
  food: number
  gold: number
  selectedId: string | null
  selectedIds: string[]
  placementKind: PlacementKind
  commandMode: CommandMode
  winner: Team | null
  worldEpoch: number
  gameTime: number
  waveStarted: boolean
  waveIndex: number
  waveStartTime: number
  helpOpen: boolean
  playerAge: Age
  ageTimer: number
  aging: boolean
  formation: Formation
  muted: boolean
  enemyAge: Age
}): HudSlice {
  const { pop, popCap } = popCounts(s.entities)
  return {
    wood: s.wood,
    food: s.food,
    gold: s.gold,
    pop,
    popCap,
    selectedId: s.selectedId,
    selectedIds: s.selectedIds,
    placementKind: s.placementKind,
    commandMode: s.commandMode,
    winner: s.winner,
    entityIds: Object.keys(s.entities),
    worldEpoch: s.worldEpoch,
    gameTime: s.gameTime,
    waveStarted: s.waveStarted,
    waveIndex: s.waveIndex,
    waveStartTime: s.waveStartTime,
    helpOpen: s.helpOpen,
    playerAge: s.playerAge,
    ageTimer: s.ageTimer,
    aging: s.aging,
    formation: s.formation,
    muted: s.muted,
    enemyAge: s.enemyAge,
  }
}

function freshWorld() {
  const world = generateWorld()
  view.targetX = PLAYER_BASE.x
  view.targetZ = PLAYER_BASE.z
  view.distance = CAMERA.defaultDistance
  resetFog()
  tickFog(Object.values(world.entities))
  return {
    entities: world.entities,
    nextId: world.nextId,
    enemyWood: 140,
    enemyFood: 120,
    enemyGold: 80,
    aiTimer: 0,
    controlGroups: {},
    manorTimer: 0,
    barracksRebuildAt: 0,
    guardCap: GUARD_CAP,
    ...hudFrom({
      entities: world.entities,
      wood: 400,
      food: 250,
      gold: 80,
      selectedId: null,
      selectedIds: [],
      placementKind: null,
      commandMode: 'none',
      winner: null,
      worldEpoch: 1,
      gameTime: 0,
      waveStarted: false,
      waveIndex: 0,
      waveStartTime: 0,
      helpOpen: true,
      playerAge: 0,
      ageTimer: 0,
      aging: false,
      formation: 'box',
      muted: false,
      enemyAge: 0,
    }),
  }
}

export function allocId(): string {
  const s = useGameStore.getState()
  const id = `e${s.nextId}`
  s.nextId += 1
  return id
}

export function canAfford(
  cost: { wood?: number; food?: number; gold?: number },
  wood: number,
  food: number,
  gold: number,
): boolean {
  return (
    wood >= (cost.wood ?? 0) &&
    food >= (cost.food ?? 0) &&
    gold >= (cost.gold ?? 0)
  )
}

export function spend(
  cost: { wood?: number; food?: number; gold?: number },
  team: Team,
): boolean {
  const s = useGameStore.getState()
  if (team === 'player') {
    if (!canAfford(cost, s.wood, s.food, s.gold)) return false
    s.wood -= cost.wood ?? 0
    s.food -= cost.food ?? 0
    s.gold -= cost.gold ?? 0
  } else {
    if (!canAfford(cost, s.enemyWood, s.enemyFood, s.enemyGold)) return false
    s.enemyWood -= cost.wood ?? 0
    s.enemyFood -= cost.food ?? 0
    s.enemyGold -= cost.gold ?? 0
  }
  markHud()
  return true
}

export function addResource(team: Team, kind: 'wood' | 'food' | 'gold', amount: number): void {
  const s = useGameStore.getState()
  if (team === 'player') {
    if (kind === 'wood') s.wood += amount
    if (kind === 'food') s.food += amount
    if (kind === 'gold') s.gold += amount
  } else {
    if (kind === 'wood') s.enemyWood += amount
    if (kind === 'food') s.enemyFood += amount
    if (kind === 'gold') s.enemyGold += amount
  }
  markHud()
}

export function isPlacementValid(x: number, z: number, kind: NonNullable<PlacementKind>): boolean {
  const radius = BUILDING_STATS[kind].radius
  if (Math.abs(x) > MAP_HALF - 3 || Math.abs(z) > MAP_HALF - 3) return false
  const { entities } = useGameStore.getState()
  const pad = kind === 'palisade' ? 0.08 : 0.7
  for (const e of Object.values(entities)) {
    if (e.dying || e.kind === 'projectile' || isUnit(e)) continue
    const need = radius + e.radius + pad
    if (dist(x, z, e.x, e.z) < need) return false
  }
  return true
}

function selectedEntity(): Entity | null {
  const s = useGameStore.getState()
  if (!s.selectedId) return null
  return s.entities[s.selectedId] ?? null
}

function selectedUnits(): Entity[] {
  const s = useGameStore.getState()
  return s.selectedIds
    .map((id) => s.entities[id])
    .filter((e): e is Entity => !!e && isUnit(e) && e.team === 'player' && !e.dying)
}

function selectedVillagers(): Entity[] {
  return selectedUnits().filter((e) => e.kind === 'villager')
}

function formationOffset(
  i: number,
  n: number,
  tx: number,
  tz: number,
  units: Entity[],
  mode: Formation,
): { x: number; z: number } {
  const gap = 1.2
  if (mode === 'line') {
    let cx = 0
    let cz = 0
    for (const u of units) {
      cx += u.x
      cz += u.z
    }
    cx /= Math.max(1, units.length)
    cz /= Math.max(1, units.length)
    const dx = tx - cx
    const dz = tz - cz
    const mag = Math.hypot(dx, dz) || 1
    const px = -dz / mag
    const pz = dx / mag
    const along = i - (n - 1) / 2
    return { x: px * along * gap, z: pz * along * gap }
  }
  const cols = Math.ceil(Math.sqrt(n))
  const row = Math.floor(i / cols)
  const col = i % cols
  return {
    x: (col - (cols - 1) / 2) * gap,
    z: (row - Math.floor((n - 1) / cols) / 2) * gap,
  }
}

function applySelection(ids: string[]): void {
  const s = useGameStore.getState()
  const live = ids.filter((id) => {
    const e = s.entities[id]
    return !!e && !e.dying
  })
  s.selectedIds = live
  s.selectedId = live[0] ?? null
  s.placementKind = null
  markHud()
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...freshWorld(),

  select: (id, additive = false) => {
    const s = get()
    if (!id) {
      applySelection([])
      set({ selectedId: null, selectedIds: [], placementKind: null, commandMode: 'none' })
      return
    }
    const target = s.entities[id]
    if (!target || target.dying) return

    if (additive && isUnit(target) && target.team === 'player') {
      const next = s.selectedIds.includes(id)
        ? s.selectedIds.filter((x) => x !== id)
        : [...s.selectedIds.filter((x) => {
            const e = s.entities[x]
            return e && isUnit(e)
          }), id]
      applySelection(next)
      set({ selectedId: next[0] ?? null, selectedIds: next, placementKind: null })
      return
    }

    applySelection([id])
    set({ selectedId: id, selectedIds: [id], placementKind: null })
  },

  selectMany: (ids) => {
    applySelection(ids)
    const s = get()
    set({ selectedId: s.selectedId, selectedIds: s.selectedIds, placementKind: null })
  },

  setPlacement: (kind) => {
    const villagers = selectedVillagers()
    if (kind && villagers.length === 0) return
    if (kind && requiredAge(kind) > get().playerAge) return
    set({ placementKind: kind, commandMode: 'none' })
    markHud()
  },

  setCommandMode: (mode) => {
    set({ commandMode: mode, placementKind: null })
    markHud()
  },

  placeBuilding: (x, z) => {
    const s = get()
    const kind = s.placementKind
    if (!kind) return false
    const villager = selectedVillagers()[0]
    if (!villager) return false
    if (requiredAge(kind) > s.playerAge) return false
    if (!isPlacementValid(x, z, kind)) return false
    const cost = COSTS[kind]
    if (!spend(cost, 'player')) return false

    const id = allocId()
    const building = createBuilding(id, kind, 'player', x, z, false)
    s.entities[id] = building
    villager.order = { type: 'build', x, z, targetId: id }
    const keep = kind === 'palisade'
    set({ placementKind: keep ? kind : null, worldEpoch: s.worldEpoch + 1 })
    markHud()
    return true
  },

  issueMove: (x, z) => {
    const s = get()
    if (s.commandMode === 'attackMove') {
      get().issueAttackMove(x, z)
      return
    }
    const units = selectedUnits()
    if (units.length > 0) {
      units.forEach((u, i) => {
        const off = formationOffset(i, units.length, x, z, units, s.formation)
        u.order = { type: 'move', x: x + off.x, z: z + off.z, targetId: null }
        u.gatherTimer = 0
      })
      return
    }
    get().setRally(x, z)
  },

  issueAttackMove: (x, z) => {
    const units = selectedUnits().filter((u) => isMilitary(u) || u.kind === 'villager')
    if (units.length === 0) {
      set({ commandMode: 'none' })
      return
    }
    units.forEach((u, i) => {
      const off = formationOffset(i, units.length, x, z, units, get().formation)
      u.order = { type: 'attackMove', x: x + off.x, z: z + off.z, targetId: null }
    })
    set({ commandMode: 'none' })
    markHud()
  },

  issueEntityOrder: (targetId) => {
    const s = get()
    const target = s.entities[targetId]
    if (!target || target.dying) return

    const units = selectedUnits()
    if (units.length === 0) {
      s.select(targetId)
      return
    }

    if (target.team === 'enemy' && (isUnit(target) || isBuilding(target))) {
      for (const u of units) {
        u.order = { type: 'attack', x: target.x, z: target.z, targetId }
      }
      set({ commandMode: 'none' })
      return
    }

    if (isGatherable(target)) {
      const villagers = units.filter((u) => u.kind === 'villager')
      for (const u of villagers) {
        u.order = { type: 'gather', x: target.x, z: target.z, targetId }
        u.gatherTimer = 0
      }
      if (villagers.length > 0) return
    }

    if (isBuilding(target) && target.team === 'player' && !isComplete(target)) {
      const villagers = units.filter((u) => u.kind === 'villager')
      for (const u of villagers) {
        u.order = { type: 'build', x: target.x, z: target.z, targetId }
      }
      if (villagers.length > 0) return
    }

    const dropKind = units.find((u) => u.kind === 'villager' && u.carryAmount > 0)?.carryResource ?? null
    if (isDropoff(target, dropKind) && target.team === 'player') {
      for (const u of units) {
        if (u.kind === 'villager' && u.carryAmount > 0) {
          u.order = { type: 'return', x: target.x, z: target.z, targetId: null }
        }
      }
      return
    }

    s.select(targetId)
  },

  setRally: (x, z) => {
    const s = get()
    const buildings = s.selectedIds
      .map((id) => s.entities[id])
      .filter((e): e is Entity => !!e && canTrain(e) && e.team === 'player' && !e.dying)
    if (buildings.length === 0) return
    for (const b of buildings) {
      b.rallyX = x
      b.rallyZ = z
      b.hasRally = true
    }
    markHud()
  },

  train: (kind) => {
    const s = get()
    const b = selectedEntity()
    if (!b || b.team !== 'player' || !isComplete(b) || b.dying) return

    const allowed =
      (b.kind === 'townCenter' && kind === 'villager') ||
      (b.kind === 'barracks' && (kind === 'sepoy' || kind === 'rajput' || kind === 'gurkha')) ||
      (b.kind === 'caravanserai' && (kind === 'sowar' || kind === 'mahout')) ||
      (b.kind === 'foundry' && kind === 'siegeElephant')
    if (!allowed) return
    if (requiredAge(kind) > s.playerAge) return
    if (b.trainQueue.length >= 5) return

    const { pop, popCap } = popCounts(s.entities)
    const queued = b.trainQueue.length
    if (pop + queued >= popCap) return

    const cost = COSTS[kind]
    if (!spend(cost, 'player')) return

    b.trainQueue.push({ kind, remaining: TRAIN_TIME[kind] })
    markHud()
  },

  setControlGroup: (slot) => {
    const s = get()
    const ids = selectedUnits().map((e) => e.id)
    s.controlGroups[slot] = ids
  },

  recallControlGroup: (slot) => {
    const s = get()
    const ids = (s.controlGroups[slot] ?? []).filter((id) => {
      const e = s.entities[id]
      return !!e && isUnit(e) && e.team === 'player' && !e.dying
    })
    s.controlGroups[slot] = ids
    applySelection(ids)
    set({ selectedId: s.selectedId, selectedIds: s.selectedIds, placementKind: null })
  },

  selectIdleVillager: () => {
    const s = get()
    const villagers = Object.values(s.entities).filter(
      (e) => e.kind === 'villager' && e.team === 'player' && !e.dying && e.order.type === 'idle',
    )
    if (villagers.length === 0) return
    const current = s.selectedId
    const idx = villagers.findIndex((v) => v.id === current)
    const next = villagers[(idx + 1) % villagers.length]
    applySelection([next.id])
    set({ selectedId: next.id, selectedIds: [next.id], placementKind: null })
    view.targetX = next.x
    view.targetZ = next.z
  },

  openHelp: () => {
    set({ helpOpen: true, commandMode: 'none', placementKind: null })
    markHud()
  },

  closeHelp: () => {
    set({ helpOpen: false })
    tickFog(Object.values(get().entities))
    startMusic()
    markHud()
  },

  startAgeUp: () => {
    const s = get()
    if (s.playerAge >= 2 || s.aging) return
    const tc = selectedEntity()
    if (!tc || tc.kind !== 'townCenter' || tc.team !== 'player' || !isComplete(tc)) return
    const cost = s.playerAge === 0 ? COSTS.commerce : COSTS.fortress
    const duration = s.playerAge === 0 ? AGE_UP_COMMERCE : AGE_UP_FORTRESS
    if (!spend(cost, 'player')) return
    s.aging = true
    s.ageTimer = duration
    markHud()
    set({ aging: true, ageTimer: duration })
  },

  setFormation: (mode) => {
    set({ formation: mode })
    markHud()
  },

  toggleMute: () => {
    const next = !get().muted
    setMuted(next)
    set({ muted: next })
    markHud()
  },

  restart: () => {
    const next = freshWorld()
    hudDirty = true
    setMuted(next.muted)
    set(next)
  },
}))

export function syncHud(): void {
  const s = useGameStore.getState()
  const slice = hudFrom(s)
  useGameStore.setState(slice)
}

export function spawnUnit(kind: UnitKind, team: Team, near: Entity): Entity {
  const s = useGameStore.getState()
  const id = allocId()
  const towardX = team === 'player' ? 1 : -1
  const towardZ = team === 'player' ? 1 : -1
  const d = near.radius + 2.2
  const unit = createUnit(
    id,
    kind,
    team,
    near.x + towardX * d * 0.72,
    near.z + towardZ * d * 0.72,
  )
  if (near.hasRally) {
    unit.order = { type: 'move', x: near.rallyX, z: near.rallyZ, targetId: null }
  }
  s.entities[id] = unit
  s.worldEpoch += 1
  markHud()
  return unit
}

function debugSetupDefense(): void {
  const s = useGameStore.getState()
  const tc = Object.values(s.entities).find(
    (e) => e.kind === 'townCenter' && e.team === 'player' && !e.dying,
  )
  if (!tc) return
  const id = allocId()
  s.entities[id] = createBuilding(id, 'barracks', 'player', tc.x + 6.5, tc.z + 0.8, true)
  const barracks = s.entities[id]
  spawnUnit('sepoy', 'player', barracks)
  spawnUnit('rajput', 'player', barracks)
  s.worldEpoch += 1
  markHud()
}

if (process.env.NODE_ENV !== 'production') {
  const g = globalThis as unknown as {
    __aoeStore: typeof useGameStore
    __aoeSetupDefense: () => void
  }
  g.__aoeStore = useGameStore
  g.__aoeSetupDefense = debugSetupDefense
}
