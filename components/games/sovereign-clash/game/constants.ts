import type { BuildingKind, ResourceKind, UnitClass, UnitKind } from './types'

export const MAP_SIZE = 160
export const MAP_HALF = MAP_SIZE / 2

export const GAME_TITLE = 'Sovereign Clash'

export const COLORS = {
  player: '#2f6fb8',
  enemy: '#c4452f',
  grass: '#5c9a4a',
  grassDark: '#3a6234',
  wood: '#8B5A2B',
  foliage: '#2d6a27',
  gold: '#eab308',
  berry: '#c026d3',
  projectile: '#fde047',
  sky: '#87b4d9',
} as const

export const PLAYER_BASE = { x: -55, z: -55 }
export const ENEMY_BASE = { x: 55, z: 55 }

export const DEATH_DURATION = 0.55
export const ATTACK_COOLDOWN = 1
export const AI_INTERVAL = 5
export const AI_COMMERCE_TIME = 480
export const AI_FORTRESS_TIME = 1080
export const AI_WAVE1_TIME = 600
export const AI_WAVE2_TIME = 1080
export const AI_WAVE3_TIME = 1560
export const AI_WAVE_INTERVAL = 240
export const AI_DEFEND_RANGE = 24
export const GUARD_CAP = 4
export const AI_MANOR_TIME = 90
export const MANOR_SPAWN_INTERVAL = 25
export const MANOR_SETTLER_CAP = 8
export const BARRACKS_REBUILD = 60
export const CHAIN_GATHER_RANGE = 10
export const BUILD_TIME = 4.5
export const PALISADE_BUILD_TIME = 1.6
export const SACRED_FIELD_BUILD_TIME = 3.4
export const AGE_UP_COMMERCE = 25
export const AGE_UP_FORTRESS = 35
export const AGGRO_RANGE = 22
export const ATTACK_MOVE_AGGRO = 10
export const GATHER_RANGE = 1.7
export const DROPOFF_RANGE = 2.2
export const CARRY_CAPACITY = 15
export const GATHER_PER_SEC = 10
export const SACRED_FIELD_FOOD_PER_SEC = 1.6
export const PROJECTILE_SPEED = 16
export const SIEGE_PROJECTILE_SPEED = 11
export const HUD_SYNC_INTERVAL = 0.2
export const TOWER_RANGE = 11
export const TOWER_ATTACK = 10
export const FOG_RES = 96
export const TRAMPLE_DAMAGE = 6
export const TRAMPLE_RADIUS = 1.7

export const AGE_NAMES = ['Discovery', 'Commerce', 'Fortress'] as const

export const UNIT_STATS: Record<
  UnitKind,
  { hp: number; speed: number; attack: number; range: number; radius: number; splash?: number }
> = {
  villager: { hp: 40, speed: 4.2, attack: 3, range: 1.55, radius: 0.38 },
  sepoy: { hp: 90, speed: 4.0, attack: 12, range: 7.5, radius: 0.4 },
  rajput: { hp: 85, speed: 5.4, attack: 13, range: 1.7, radius: 0.4 },
  sowar: { hp: 95, speed: 7.0, attack: 11, range: 1.6, radius: 0.55 },
  gurkha: { hp: 70, speed: 4.6, attack: 14, range: 10, radius: 0.38 },
  mahout: { hp: 420, speed: 2.4, attack: 22, range: 2.1, radius: 1.05 },
  siegeElephant: { hp: 380, speed: 2.1, attack: 35, range: 8.2, radius: 1.12, splash: 2.6 },
  pikeman: { hp: 90, speed: 3.8, attack: 12, range: 2.0, radius: 0.4 },
  longbowman: { hp: 50, speed: 4.4, attack: 10, range: 9.5, radius: 0.38 },
  redcoat: { hp: 85, speed: 4.0, attack: 13, range: 7.8, radius: 0.4 },
  hussar: { hp: 90, speed: 7.4, attack: 12, range: 1.55, radius: 0.52 },
  dragoon: { hp: 95, speed: 6.6, attack: 14, range: 7.2, radius: 0.52 },
  falconet: { hp: 110, speed: 2.5, attack: 40, range: 12, radius: 0.75, splash: 2.6 },
}

export const UNIT_CLASS: Record<UnitKind, UnitClass> = {
  villager: 'villager',
  sepoy: 'rangedInf',
  rajput: 'meleeInf',
  sowar: 'cavalry',
  gurkha: 'rangedInf',
  mahout: 'elephant',
  siegeElephant: 'siege',
  pikeman: 'meleeInf',
  longbowman: 'rangedInf',
  redcoat: 'rangedInf',
  hussar: 'cavalry',
  dragoon: 'cavalry',
  falconet: 'siege',
}

export const BUILDING_STATS: Record<
  BuildingKind,
  { hp: number; radius: number; pop: number }
> = {
  townCenter: { hp: 700, radius: 2.6, pop: 20 },
  barracks: { hp: 380, radius: 2.1, pop: 0 },
  house: { hp: 200, radius: 1.5, pop: 10 },
  sacredField: { hp: 140, radius: 1.7, pop: 0 },
  lumberCamp: { hp: 220, radius: 1.7, pop: 0 },
  mill: { hp: 220, radius: 1.7, pop: 0 },
  miningCamp: { hp: 220, radius: 1.7, pop: 0 },
  palisade: { hp: 90, radius: 0.52, pop: 0 },
  caravanserai: { hp: 400, radius: 2.2, pop: 0 },
  agraFort: { hp: 520, radius: 2.0, pop: 0 },
  foundry: { hp: 360, radius: 2.0, pop: 0 },
  manor: { hp: 280, radius: 1.8, pop: 0 },
}

export const RESOURCE_STATS: Record<
  'tree' | 'berryBush' | 'goldMine' | 'herd',
  { amount: number; radius: number; resource: ResourceKind }
> = {
  tree: { amount: 160, radius: 0.65, resource: 'wood' },
  berryBush: { amount: 90, radius: 0.7, resource: 'food' },
  goldMine: { amount: 360, radius: 0.85, resource: 'gold' },
  herd: { amount: 80, radius: 0.72, resource: 'food' },
}

export const COSTS: Record<string, { wood?: number; food?: number; gold?: number }> = {
  villager: { wood: 100 },
  sepoy: { food: 50, gold: 40 },
  rajput: { food: 65, gold: 25 },
  sowar: { food: 80, gold: 50 },
  gurkha: { food: 70, gold: 55 },
  mahout: { food: 180, gold: 90 },
  siegeElephant: { wood: 200, gold: 120 },
  house: { wood: 75 },
  barracks: { wood: 150, gold: 50 },
  sacredField: { wood: 80 },
  lumberCamp: { wood: 100 },
  mill: { wood: 100 },
  miningCamp: { wood: 100 },
  townCenter: { wood: 300, gold: 100 },
  palisade: { wood: 8 },
  caravanserai: { wood: 160, gold: 40 },
  agraFort: { wood: 200, gold: 80 },
  foundry: { wood: 180, gold: 80 },
  commerce: { food: 800 },
  fortress: { food: 1200, gold: 1000 },
}

export const TRAIN_TIME: Record<UnitKind, number> = {
  villager: 10,
  sepoy: 12,
  rajput: 11,
  sowar: 12,
  gurkha: 14,
  mahout: 22,
  siegeElephant: 24,
  pikeman: 11,
  longbowman: 12,
  redcoat: 12,
  hussar: 12,
  dragoon: 14,
  falconet: 20,
}

export const DISPLAY_NAMES: Record<string, string> = {
  villager: 'Villager',
  sepoy: 'Sepoy',
  rajput: 'Rajput',
  sowar: 'Sowar',
  gurkha: 'Gurkha',
  mahout: 'Mahout Lancer',
  siegeElephant: 'Siege Elephant',
  pikeman: 'Pikeman',
  longbowman: 'Longbowman',
  redcoat: 'Redcoat',
  hussar: 'Hussar',
  dragoon: 'Dragoon',
  falconet: 'Falconet',
  townCenter: 'Town Center',
  barracks: 'Barracks',
  house: 'House',
  sacredField: 'Sacred Field',
  lumberCamp: 'Lumber Camp',
  mill: 'Mill',
  miningCamp: 'Mining Camp',
  palisade: 'Palisade',
  caravanserai: 'Caravanserai',
  agraFort: 'Agra Fort',
  foundry: 'Artillery Foundry',
  manor: 'Manor',
  tree: 'Tree',
  berryBush: 'Berry Bush',
  goldMine: 'Gold Mine',
  herd: 'Herd',
}

export const CAMERA = {
  minDistance: 16,
  maxDistance: 110,
  defaultDistance: 32,
  heightFactor: 0.78,
}

export function visionRange(kind: string, isBuilding: boolean): number {
  if (kind === 'sowar' || kind === 'hussar' || kind === 'dragoon') return 14
  if (kind === 'agraFort' || kind === 'townCenter') return 13
  if (kind === 'falconet' || kind === 'siegeElephant') return 8
  if (kind === 'mahout') return 9
  if (isBuilding) return 5
  return 8
}
