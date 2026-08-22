import {
  BUILDING_STATS,
  ENEMY_BASE,
  PLAYER_BASE,
  RESOURCE_STATS,
  TOWER_ATTACK,
  TOWER_RANGE,
  UNIT_STATS,
} from './constants'
import {
  idleOrder,
  type BuildingKind,
  type Entity,
  type Team,
  type UnitKind,
} from './types'

const MAP_LIMIT = 76

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface WorldSeed {
  entities: Record<string, Entity>
  nextId: number
}

function blank(id: string, kind: Entity['kind'], team: Team, x: number, z: number): Entity {
  return {
    id,
    kind,
    team,
    x,
    z,
    y: 0,
    hp: 1,
    maxHp: 1,
    radius: 0.4,
    facing: 0,
    speed: 0,
    attack: 0,
    attackRange: 0,
    attackTimer: 0,
    order: idleOrder(),
    carryResource: null,
    carryAmount: 0,
    gatherTimer: 0,
    buildProgress: 1,
    trainQueue: [],
    amount: 0,
    resourceType: null,
    dying: false,
    deathTimer: 0,
    scale: 1,
    targetId: null,
    damage: 0,
    projectileSpeed: 0,
    splash: 0,
    rallyX: x,
    rallyZ: z,
    hasRally: false,
    gatherKind: null,
    guard: false,
  }
}

export function createUnit(
  id: string,
  kind: UnitKind,
  team: Team,
  x: number,
  z: number,
): Entity {
  const stats = UNIT_STATS[kind]
  const e = blank(id, kind, team, x, z)
  e.hp = stats.hp
  e.maxHp = stats.hp
  e.speed = stats.speed
  e.attack = stats.attack
  e.attackRange = stats.range
  e.radius = stats.radius
  e.splash = stats.splash ?? 0
  return e
}

export function createBuilding(
  id: string,
  kind: BuildingKind,
  team: Team,
  x: number,
  z: number,
  complete = true,
): Entity {
  const stats = BUILDING_STATS[kind]
  const e = blank(id, kind, team, x, z)
  e.hp = complete ? stats.hp : Math.max(40, stats.hp * 0.15)
  e.maxHp = stats.hp
  e.radius = stats.radius
  e.buildProgress = complete ? 1 : 0
  if (kind === 'agraFort') {
    e.attack = TOWER_ATTACK
    e.attackRange = TOWER_RANGE
  }
  return e
}

export function createResource(
  id: string,
  kind: 'tree' | 'berryBush' | 'goldMine' | 'herd',
  x: number,
  z: number,
  scale = 1,
): Entity {
  const stats = RESOURCE_STATS[kind]
  const e = blank(id, kind, 'neutral', x, z)
  e.amount = stats.amount
  e.resourceType = stats.resource
  e.radius = stats.radius
  e.scale = scale
  e.hp = 1
  e.maxHp = 1
  return e
}

export function createProjectile(
  id: string,
  team: Team,
  x: number,
  z: number,
  targetId: string,
  damage: number,
  splash = 0,
  speed = 16,
): Entity {
  const e = blank(id, 'projectile', team, x, z)
  e.y = splash > 0 ? 1.6 : 1.2
  e.targetId = targetId
  e.damage = damage
  e.projectileSpeed = speed
  e.splash = splash
  e.radius = splash > 0 ? 0.28 : 0.12
  return e
}

function tooClose(
  x: number,
  z: number,
  spots: { x: number; z: number; r: number }[],
  r: number,
): boolean {
  for (const s of spots) {
    if (Math.hypot(x - s.x, z - s.z) < s.r + r) return true
  }
  return false
}

export function generateWorld(): WorldSeed {
  const rand = mulberry32(42)
  const entities: Record<string, Entity> = {}
  let n = 1
  const id = () => `e${n++}`
  const occupied: { x: number; z: number; r: number }[] = []

  const add = (e: Entity, pad = 0.8) => {
    entities[e.id] = e
    occupied.push({ x: e.x, z: e.z, r: e.radius + pad })
  }

  add(createBuilding(id(), 'townCenter', 'player', PLAYER_BASE.x, PLAYER_BASE.z, true))
  add(createUnit(id(), 'villager', 'player', PLAYER_BASE.x + 3.4, PLAYER_BASE.z + 1.6))

  add(createBuilding(id(), 'townCenter', 'enemy', ENEMY_BASE.x, ENEMY_BASE.z, true))
  add(createUnit(id(), 'villager', 'enemy', ENEMY_BASE.x - 3.2, ENEMY_BASE.z - 1.4))
  add(createUnit(id(), 'villager', 'enemy', ENEMY_BASE.x - 2.0, ENEMY_BASE.z - 3.2))
  add(createUnit(id(), 'villager', 'enemy', ENEMY_BASE.x - 4.4, ENEMY_BASE.z - 2.2))

  const guards: UnitKind[] = ['pikeman', 'pikeman', 'longbowman', 'longbowman']
  guards.forEach((kind, i) => {
    const ang = (i / guards.length) * Math.PI * 2 + 0.5
    const r = 4.6
    const unit = createUnit(
      id(),
      kind,
      'enemy',
      ENEMY_BASE.x + Math.cos(ang) * r,
      ENEMY_BASE.z + Math.sin(ang) * r,
    )
    unit.guard = true
    add(unit)
  })

  const starter: { kind: 'tree' | 'berryBush' | 'goldMine' | 'herd'; x: number; z: number }[] = [
    { kind: 'tree', x: PLAYER_BASE.x + 6, z: PLAYER_BASE.z + 2 },
    { kind: 'tree', x: PLAYER_BASE.x + 7.2, z: PLAYER_BASE.z - 1.5 },
    { kind: 'tree', x: PLAYER_BASE.x + 4.5, z: PLAYER_BASE.z + 5.5 },
    { kind: 'tree', x: PLAYER_BASE.x + 8.5, z: PLAYER_BASE.z + 4 },
    { kind: 'tree', x: PLAYER_BASE.x + 6.8, z: PLAYER_BASE.z - 4.2 },
    { kind: 'tree', x: PLAYER_BASE.x - 2.2, z: PLAYER_BASE.z + 6.5 },
    { kind: 'tree', x: PLAYER_BASE.x + 3.2, z: PLAYER_BASE.z - 7 },
    { kind: 'tree', x: PLAYER_BASE.x - 4, z: PLAYER_BASE.z - 6.8 },
    { kind: 'tree', x: PLAYER_BASE.x + 8.8, z: PLAYER_BASE.z + 0.5 },
    { kind: 'tree', x: PLAYER_BASE.x + 1.5, z: PLAYER_BASE.z + 8.8 },
    { kind: 'berryBush', x: PLAYER_BASE.x + 2, z: PLAYER_BASE.z + 7.5 },
    { kind: 'berryBush', x: PLAYER_BASE.x - 1.5, z: PLAYER_BASE.z + 8.2 },
    { kind: 'goldMine', x: PLAYER_BASE.x - 6.5, z: PLAYER_BASE.z + 5 },
    { kind: 'goldMine', x: PLAYER_BASE.x - 8, z: PLAYER_BASE.z + 2.5 },
    { kind: 'goldMine', x: PLAYER_BASE.x - 5.2, z: PLAYER_BASE.z - 6.5 },
    { kind: 'goldMine', x: PLAYER_BASE.x - 7.6, z: PLAYER_BASE.z - 3.4 },
    { kind: 'goldMine', x: PLAYER_BASE.x + 7.4, z: PLAYER_BASE.z - 6.2 },
    { kind: 'tree', x: ENEMY_BASE.x - 6, z: ENEMY_BASE.z - 2 },
    { kind: 'tree', x: ENEMY_BASE.x - 7.2, z: ENEMY_BASE.z + 1.5 },
    { kind: 'berryBush', x: ENEMY_BASE.x - 2, z: ENEMY_BASE.z - 7.5 },
    { kind: 'goldMine', x: ENEMY_BASE.x + 6.5, z: ENEMY_BASE.z - 5 },
  ]

  for (const s of starter) {
    add(createResource(id(), s.kind, s.x, s.z, 0.9 + rand() * 0.3), 0.4)
  }

  const nearBase = (x: number, z: number, range = 9.5) =>
    Math.hypot(x - PLAYER_BASE.x, z - PLAYER_BASE.z) < range ||
    Math.hypot(x - ENEMY_BASE.x, z - ENEMY_BASE.z) < range

  const placeCluster = (
    kind: 'tree' | 'berryBush' | 'goldMine' | 'herd',
    cx: number,
    cz: number,
    count: number,
    spread: number,
  ) => {
    const pad = kind === 'tree' || kind === 'goldMine' ? 0.38 : 0.55
    let placed = 0
    let attempts = 0
    const maxAttempts = Math.max(120, count * 18)
    while (placed < count && attempts < maxAttempts) {
      attempts += 1
      const ang = rand() * Math.PI * 2
      const rad = rand() * spread
      const x = cx + Math.cos(ang) * rad
      const z = cz + Math.sin(ang) * rad
      if (Math.abs(x) > MAP_LIMIT || Math.abs(z) > MAP_LIMIT) continue
      if (nearBase(x, z)) continue
      const r = RESOURCE_STATS[kind].radius
      if (tooClose(x, z, occupied, r + 0.7)) continue
      add(createResource(id(), kind, x, z, 0.8 + rand() * 0.4), pad)
      placed += 1
    }
  }

  for (let gx = -70; gx <= 70; gx += 16) {
    for (let gz = -70; gz <= 70; gz += 16) {
      const x = gx + (rand() - 0.5) * 7
      const z = gz + (rand() - 0.5) * 7
      if (nearBase(x, z, 12)) continue
      if (rand() < 0.12) continue
      placeCluster('tree', x, z, 11 + Math.floor(rand() * 7), 5.8)
    }
  }

  for (let gx = -66; gx <= 66; gx += 20) {
    for (let gz = -66; gz <= 66; gz += 20) {
      const x = gx + (rand() - 0.5) * 8
      const z = gz + (rand() - 0.5) * 8
      if (nearBase(x, z, 11)) continue
      if (rand() < 0.08) continue
      placeCluster('goldMine', x, z, 3 + Math.floor(rand() * 3), 2.6)
    }
  }

  const berries: [number, number, number, number][] = [
    [-46, -40, 5, 2.6],
    [-32, -64, 5, 2.4],
    [8, -28, 4, 2.2],
    [46, 40, 5, 2.6],
    [32, 64, 5, 2.4],
    [-6, 24, 4, 2.2],
    [-20, 36, 4, 2.3],
    [20, -36, 4, 2.3],
  ]
  for (const [x, z, n, s] of berries) placeCluster('berryBush', x, z, n, s)

  const herds: [number, number, number, number][] = [
    [-18, -8, 3, 2.2],
    [18, 10, 3, 2.2],
    [-28, 14, 3, 2.4],
    [28, -14, 3, 2.4],
  ]
  for (const [x, z, n, s] of herds) placeCluster('herd', x, z, n, s)

  return { entities, nextId: n }
}
