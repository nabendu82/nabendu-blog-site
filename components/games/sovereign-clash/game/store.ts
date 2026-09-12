import { create } from 'zustand'
import { isDry, isSailable, isCrossing, nearestDry, nearestWater, setActiveTerrain, bridgeHeight, terrainRoute, type TerrainKind } from './terrain'
import { applyNavalCivilization } from './navy'
import { applyIndustrialUpgrade } from './progression'
import {
  AGE_ADVANCEMENTS,
  MODERN_TRAINING,
  INDUSTRIAL_CIVS,
  FACTORY_LIMIT,
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
import { clearMovementRoute, dist } from './pathfinding'
import {
  canTrain,
  canAttackTarget,
  isBuilding,
  isComplete,
  isDropoff,
  isGatherable,
  isMilitary,
  isUnit,
  isShip,
  requiredAge,
  type Age,
  type BuildingKind,
  type Civilization,
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
  hit: false,
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
  terrain: TerrainKind
  entities: Record<string, Entity>
  matchId: number
  nextId: number
  enemyWood: number
  enemyFood: number
  enemyGold: number
  enemyPetrol: number
  enemyMetal: number
  aiTimer: number
  navyTimer:number
  controlGroups: Record<number, string[]>
  manorTimer: number
  enemyBuiltUnique: boolean
  barracksRebuildTimer: number
  enemyBuiltBarracks: boolean
  enemyBuiltFortress: boolean
  guardCap: number
  playerCiv: Civilization
  enemyCiv: Civilization
  civModalOpen: boolean
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
  unloadTransport: () => void
  setCivilizations: (playerCiv: Civilization, enemyCiv: Civilization, terrain?: TerrainKind) => void
  openCivModal: () => void
  closeCivModal: () => void
}

export function popCounts(entities: Record<string, Entity>): { pop: number; popCap: number } {
  let pop = 0
  let popCap = 0
  for (const e of Object.values(entities)) {
    if (e.team !== 'player' || e.dying) continue
    if (isUnit(e)) pop += 1 + (e.passengers?.length ?? 0)
    if (isBuilding(e) && isComplete(e)) popCap += BUILDING_STATS[e.kind as BuildingKind].pop
  }
  return { pop, popCap }
}

function hudFrom(s: {
  entities: Record<string, Entity>
  wood: number
  food: number
  gold: number
  petrol: number
  metal: number
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
  playerCiv: Civilization
  enemyCiv: Civilization
  civModalOpen: boolean
}): HudSlice {
  const { pop, popCap } = popCounts(s.entities)
  const selectedIds = s.selectedIds.filter(id => s.entities[id] && !s.entities[id].dying)
  return {
    wood: s.wood,
    food: s.food,
    gold: s.gold,
    petrol: s.petrol,
    metal: s.metal,
    pop,
    popCap,
    selectedId: selectedIds[0] ?? null,
    selectedIds,
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
    playerCiv: s.playerCiv,
    enemyCiv: s.enemyCiv,
    civModalOpen: s.civModalOpen,
  }
}

let worldGeneration = 0

function freshWorld(
  playerCiv: Civilization = 'indian',
  enemyCiv: Civilization = 'british',
  civModalOpen = true,
  terrain: TerrainKind = 'grassland',
) {
  setActiveTerrain(terrain)
  const world = generateWorld(enemyCiv, terrain)
  view.targetX = PLAYER_BASE.x
  view.targetZ = PLAYER_BASE.z
  view.distance = CAMERA.defaultDistance
  resetFog()
  tickFog(Object.values(world.entities))
  return {
    entities: world.entities,
    terrain,
    matchId: worldGeneration + 1,
    nextId: world.nextId,
    enemyWood: 140,
    enemyFood: 120,
    enemyGold: 80,
    enemyPetrol: 0,
    enemyMetal: 0,
    aiTimer: 0,
    navyTimer:0,
    controlGroups: {},
    manorTimer: 0,
    enemyBuiltUnique: false,
    barracksRebuildTimer: 0,
    enemyBuiltBarracks: false,
    enemyBuiltFortress: false,
    guardCap: GUARD_CAP,
    ...hudFrom({
      entities: world.entities,
      wood: 400,
      food: 250,
      gold: 80,
      petrol: 0,
      metal: 0,
      selectedId: null,
      selectedIds: [],
      placementKind: null,
      commandMode: 'none',
      winner: null,
      worldEpoch: ++worldGeneration,
      gameTime: 0,
      waveStarted: false,
      waveIndex: 0,
      waveStartTime: 0,
      helpOpen: false,
      playerAge: 0,
      ageTimer: 0,
      aging: false,
      formation: 'box',
      muted: false,
      enemyAge: 0,
      playerCiv,
      enemyCiv,
      civModalOpen,
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
  cost: { wood?: number; food?: number; gold?: number; petrol?: number; metal?: number },
  wood: number,
  food: number,
  gold: number,
  petrol = 0,
  metal = 0,
): boolean {
  return (
    wood >= (cost.wood ?? 0) &&
    food >= (cost.food ?? 0) &&
    gold >= (cost.gold ?? 0) && petrol >= (cost.petrol ?? 0) && metal >= (cost.metal ?? 0)
  )
}

export function spend(
  cost: { wood?: number; food?: number; gold?: number; petrol?: number; metal?: number },
  team: Team,
): boolean {
  const s = useGameStore.getState()
  if (team === 'player') {
    if (!canAfford(cost, s.wood, s.food, s.gold, s.petrol, s.metal)) return false
    s.wood -= cost.wood ?? 0
    s.food -= cost.food ?? 0
    s.gold -= cost.gold ?? 0
    s.petrol -= cost.petrol ?? 0
    s.metal -= cost.metal ?? 0
  } else {
    if (!canAfford(cost, s.enemyWood, s.enemyFood, s.enemyGold, s.enemyPetrol, s.enemyMetal)) return false
    s.enemyWood -= cost.wood ?? 0
    s.enemyFood -= cost.food ?? 0
    s.enemyGold -= cost.gold ?? 0
    s.enemyPetrol -= cost.petrol ?? 0
    s.enemyMetal -= cost.metal ?? 0
  }
  markHud()
  return true
}

export function addResource(team: Team, kind: 'wood' | 'food' | 'gold' | 'petrol' | 'metal', amount: number): void {
  const s = useGameStore.getState()
  const val = Math.round(amount)
  if (team === 'player') {
    if (kind === 'wood') s.wood += val
    if (kind === 'food') s.food += val
    if (kind === 'gold') s.gold += val
    if (kind === 'petrol') s.petrol += val
    if (kind === 'metal') s.metal += val
  } else {
    if (kind === 'wood') s.enemyWood += val
    if (kind === 'food') s.enemyFood += val
    if (kind === 'gold') s.enemyGold += val
    if (kind === 'petrol') s.enemyPetrol += val
    if (kind === 'metal') s.enemyMetal += val
  }
  markHud()
}

export function isPlacementValid(x: number, z: number, kind: NonNullable<PlacementKind>): boolean {
  const radius = BUILDING_STATS[kind].radius
  const terrain = useGameStore.getState().terrain
  if (!isDry(terrain, x, z, radius + 0.5) || isCrossing(terrain, x, z)) return false
  if (bridgeHeight(terrain,x,z)>0) return false
  if (kind === 'dock' && !nearestWater(terrain,x,z,1.7,6)) return false
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
    if (kind === 'factory' && Object.values(s.entities).filter(e => e.team === 'player' && e.kind === 'factory' && !e.dying).length >= FACTORY_LIMIT) return false
    if (!isPlacementValid(x, z, kind)) return false
    const cost = COSTS[kind]
    if (!spend(cost, 'player')) return false

    const id = allocId()
    const building = createBuilding(id, kind, 'player', x, z, false)
    if(kind==='dock') {const sea=nearestWater(s.terrain,x,z,1.7,6);if(sea)building.facing=Math.atan2(sea.x-x,sea.z-z)}
    applyIndustrialUpgrade(building, s.playerCiv, s.playerAge)
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
        if(u.attack<=0 || !canAttackTarget(u,target))continue
        u.order = { type: 'attack', x: target.x, z: target.z, targetId }
        u.attackTimer = Math.min(u.attackTimer, 0.2)
      }
      set({ commandMode: 'none' })
      markHud()
      return
    }

    if (isGatherable(target)) {
      if (requiredAge(target.kind) > s.playerAge) return
      const villagers = units.filter((u) => target.kind==='fish' ? u.kind==='fishingBoat' || (u.kind==='villager' && target.shoreFish) : u.kind==='villager')
      for (const u of villagers) {
        u.order = { type: 'gather', x: target.x, z: target.z, targetId }
        u.gatherTimer = 0
        u.gatherKind = target.kind as NonNullable<Entity['gatherKind']>
      }
      if (villagers.length > 0) return
    }

    if(target.kind==='transportShip' && target.team==='player') {
      for(const u of units) if(!isShip(u) && u.kind!=='helicopter')u.order={type:'board',x:target.x,z:target.z,targetId}
      markHud();return
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
      (MODERN_TRAINING[b.kind as BuildingKind]?.includes(kind) ?? false) ||
      (b.kind==='dock' && isShip({kind})) ||
      (b.kind === 'factory' && kind === INDUSTRIAL_CIVS[s.playerCiv].artillery) ||
      (b.kind === 'townCenter' && kind === 'villager') ||
      (b.kind === 'barracks' &&
        (kind === 'sepoy' ||
          kind === 'rajput' ||
          kind === 'gurkha' ||
          kind === 'pikeman' ||
          kind === 'longbowman' ||
          kind === 'redcoat' ||
          kind === 'ashigaru' ||
          kind === 'yumiArcher' ||
          kind === 'samurai' ||
          kind === 'crossbowman' ||
          kind === 'halberdier')) ||
      (b.kind === 'caravanserai' &&
        (kind === 'sowar' ||
          kind === 'mahout' ||
          kind === 'hussar' ||
          kind === 'dragoon' ||
          kind === 'naginata' ||
          kind === 'cuirassier')) ||
      (b.kind === 'foundry' &&
        (kind === 'siegeElephant' || kind === 'falconet'))
    if (!allowed) return
    if (requiredAge(kind) > s.playerAge) return
    if (b.trainQueue.length >= 5) return

    const { pop, popCap } = popCounts(s.entities)
    const queued = Object.values(s.entities).reduce((total, e) =>
      total + (e.team === 'player' && !e.dying ? e.trainQueue.length : 0), 0)
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
    if (s.playerAge >= 4 || s.aging) return
    const tc = selectedEntity()
    if (!tc || tc.kind !== 'townCenter' || tc.team !== 'player' || !isComplete(tc)) return
    const { cost, duration } = AGE_ADVANCEMENTS[s.playerAge as 0 | 1 | 2 | 3]
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
    const current = get()
    const next = freshWorld(current.playerCiv, current.enemyCiv, false, current.terrain)
    hudDirty = true
    setMuted(next.muted)
    set(next)
  },

  unloadTransport: () => {
    const s=get(), ship=selectedEntity()
    if(!ship || ship.team!=='player' || ship.kind!=='transportShip' || ship.dying || !ship.passengers?.length)return
    const remaining:Entity[]=[]
    for(const passenger of ship.passengers) {
      let placed=false
      for(let r=2;r<=7 && !placed;r+=0.65)for(let i=0;i<24;i++) {
        const x=ship.x+Math.cos(i*Math.PI/12)*r,z=ship.z+Math.sin(i*Math.PI/12)*r
        if(!isDry(s.terrain,x,z,passenger.radius+0.2) || bridgeHeight(s.terrain,x,z)>0)continue
        if(Object.values(s.entities).some(o=>!o.dying && o.kind!=='projectile' && !isShip(o) && Math.hypot(o.x-x,o.z-z)<o.radius+passenger.radius+0.1))continue
        if(!terrainRoute(s.terrain,x,z,x,z,false,passenger.radius+0.1).length)continue
        passenger.x=x;passenger.z=z;passenger.y=0;passenger.embarked=false;passenger.order={type:'idle',x,z,targetId:null}
        clearMovementRoute(passenger)
        s.entities[passenger.id]=passenger;placed=true;break
      }
      if(!placed)remaining.push(passenger)
    }
    ship.passengers=remaining;s.worldEpoch++;markHud();syncHud()
  },

  setCivilizations: (playerCiv, enemyCiv, terrain = get().terrain) => {
    const next = freshWorld(playerCiv, enemyCiv, false, terrain)
    hudDirty = true
    setMuted(next.muted)
    set(next)
    startMusic()
  },

  openCivModal: () => {
    set({ civModalOpen: true })
    markHud()
  },

  closeCivModal: () => {
    set({ civModalOpen: false })
    tickFog(Object.values(get().entities))
    startMusic()
    markHud()
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
  applyIndustrialUpgrade(unit, team === 'player' ? s.playerCiv : s.enemyCiv, team === 'player' ? s.playerAge : s.enemyAge)
  const dry = isShip(unit) ? nearestWater(s.terrain,near.x,near.z,1.7) : nearestDry(s.terrain, unit.x, unit.z, unit.radius + 0.6)
  if(!dry) return unit
  unit.x = dry.x
  unit.z = dry.z
  if(isShip(unit)) {
    const ships=Object.values(s.entities).filter(e=>isShip(e)&&!e.dying)
    const free=(x:number,z:number)=>isSailable(s.terrain,x,z,1.7)&&ships.every(e=>Math.hypot(e.x-x,e.z-z)>e.radius+unit.radius+0.3)
    let placed=free(unit.x,unit.z)
    for(let r=2;r<=10&&!placed;r+=1.5)for(let i=0;i<16;i++) {
      const x=dry.x+Math.cos(i*Math.PI/8)*r,z=dry.z+Math.sin(i*Math.PI/8)*r
      if(free(x,z)){unit.x=x;unit.z=z;placed=true;break}
    }
  }
  if(isShip(unit))applyNavalCivilization(unit,team==='player'?s.playerCiv:s.enemyCiv)
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
