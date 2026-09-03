export type Team = 'player' | 'enemy' | 'neutral'

export type Civilization = 'indian' | 'british' | 'japanese' | 'ottoman'

export type ResourceKind = 'wood' | 'food' | 'gold'

export type Age = 0 | 1 | 2

export type Formation = 'box' | 'line'

export type UnitClass =
  | 'villager'
  | 'meleeInf'
  | 'rangedInf'
  | 'cavalry'
  | 'elephant'
  | 'siege'

export type UnitKind =
  // Indian Units
  | 'villager'
  | 'sepoy'
  | 'rajput'
  | 'sowar'
  | 'gurkha'
  | 'mahout'
  | 'siegeElephant'
  // British Units
  | 'pikeman'
  | 'longbowman'
  | 'redcoat'
  | 'hussar'
  | 'dragoon'
  | 'falconet'
  // Japanese Units
  | 'samurai'
  | 'yumiArcher'
  | 'ashigaru'
  | 'naginata'
  // Ottoman Units
  | 'janissary'
  | 'bashiBazouk'
  | 'spahi'
  | 'greatBombard'

export type BuildingKind =
  | 'townCenter'
  | 'barracks'
  | 'house'
  | 'sacredField'
  | 'lumberCamp'
  | 'mill'
  | 'miningCamp'
  | 'palisade'
  | 'caravanserai'
  | 'agraFort'
  | 'foundry'
  | 'manor'
  // Japanese Buildings
  | 'toriiShrine'
  | 'tenshu'
  // Ottoman Buildings
  | 'mosque'

export type EntityKind =
  | UnitKind
  | BuildingKind
  | 'tree'
  | 'berryBush'
  | 'goldMine'
  | 'herd'
  | 'projectile'

export type OrderType =
  | 'idle'
  | 'move'
  | 'gather'
  | 'return'
  | 'build'
  | 'attack'
  | 'attackMove'

export interface Order {
  type: OrderType
  x: number
  z: number
  targetId: string | null
}

export interface TrainJob {
  kind: UnitKind
  remaining: number
}

export interface Entity {
  id: string
  kind: EntityKind
  team: Team
  x: number
  z: number
  y: number
  hp: number
  maxHp: number
  radius: number
  facing: number
  speed: number
  attack: number
  attackRange: number
  attackTimer: number
  order: Order
  carryResource: ResourceKind | null
  carryAmount: number
  gatherTimer: number
  buildProgress: number
  trainQueue: TrainJob[]
  amount: number
  resourceType: ResourceKind | null
  dying: boolean
  deathTimer: number
  scale: number
  targetId: string | null
  damage: number
  projectileSpeed: number
  splash: number
  rallyX: number
  rallyZ: number
  hasRally: boolean
  gatherKind: 'tree' | 'berryBush' | 'goldMine' | 'herd' | null
  guard: boolean
}

export type PlacementKind =
  | 'barracks'
  | 'house'
  | 'manor'
  | 'sacredField'
  | 'toriiShrine'
  | 'tenshu'
  | 'mosque'
  | 'lumberCamp'
  | 'mill'
  | 'miningCamp'
  | 'townCenter'
  | 'palisade'
  | 'caravanserai'
  | 'agraFort'
  | 'foundry'
  | null

export type CommandMode = 'none' | 'attackMove'

export interface HudSlice {
  wood: number
  food: number
  gold: number
  pop: number
  popCap: number
  selectedId: string | null
  selectedIds: string[]
  placementKind: PlacementKind
  commandMode: CommandMode
  winner: Team | null
  entityIds: string[]
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
}

export function idleOrder(): Order {
  return { type: 'idle', x: 0, z: 0, targetId: null }
}

export function isUnit(e: Entity): e is Entity & { kind: UnitKind } {
  return (
    e.kind === 'villager' ||
    e.kind === 'sepoy' ||
    e.kind === 'rajput' ||
    e.kind === 'sowar' ||
    e.kind === 'gurkha' ||
    e.kind === 'mahout' ||
    e.kind === 'siegeElephant' ||
    e.kind === 'pikeman' ||
    e.kind === 'longbowman' ||
    e.kind === 'redcoat' ||
    e.kind === 'hussar' ||
    e.kind === 'dragoon' ||
    e.kind === 'falconet' ||
    e.kind === 'samurai' ||
    e.kind === 'yumiArcher' ||
    e.kind === 'ashigaru' ||
    e.kind === 'naginata' ||
    e.kind === 'janissary' ||
    e.kind === 'bashiBazouk' ||
    e.kind === 'spahi' ||
    e.kind === 'greatBombard'
  )
}

export function isBuilding(e: Entity): boolean {
  return (
    e.kind === 'townCenter' ||
    e.kind === 'barracks' ||
    e.kind === 'house' ||
    e.kind === 'sacredField' ||
    e.kind === 'lumberCamp' ||
    e.kind === 'mill' ||
    e.kind === 'miningCamp' ||
    e.kind === 'palisade' ||
    e.kind === 'caravanserai' ||
    e.kind === 'agraFort' ||
    e.kind === 'foundry' ||
    e.kind === 'manor' ||
    e.kind === 'toriiShrine' ||
    e.kind === 'tenshu' ||
    e.kind === 'mosque'
  )
}

export function isResource(e: Entity): boolean {
  return e.kind === 'tree' || e.kind === 'berryBush' || e.kind === 'goldMine' || e.kind === 'herd'
}

export function isGatherable(e: Entity): boolean {
  if (e.dying || e.amount <= 0 || !e.resourceType) return false
  return isResource(e)
}

export function isDropoff(e: Entity, resource: ResourceKind | null = null): boolean {
  if (e.dying || !isComplete(e)) return false
  if (e.kind === 'townCenter') return true
  if (resource === 'wood' && e.kind === 'lumberCamp') return true
  if (resource === 'food' && e.kind === 'mill') return true
  if (resource === 'gold' && e.kind === 'miningCamp') return true
  if (!resource) {
    return e.kind === 'lumberCamp' || e.kind === 'mill' || e.kind === 'miningCamp'
  }
  return false
}

export function isMilitary(e: Entity): boolean {
  return isUnit(e) && e.kind !== 'villager'
}

export function isComplete(e: Entity): boolean {
  return e.buildProgress >= 1
}

export function canTrain(e: Entity): boolean {
  return (
    e.kind === 'townCenter' ||
    e.kind === 'barracks' ||
    e.kind === 'caravanserai' ||
    e.kind === 'foundry'
  )
}

export function requiredAge(kind: string): Age {
  if (
    kind === 'barracks' ||
    kind === 'caravanserai' ||
    kind === 'sepoy' ||
    kind === 'rajput' ||
    kind === 'sowar' ||
    kind === 'pikeman' ||
    kind === 'longbowman' ||
    kind === 'hussar' ||
    kind === 'ashigaru' ||
    kind === 'yumiArcher' ||
    kind === 'bashiBazouk' ||
    kind === 'janissary'
  ) {
    return 1
  }
  if (
    kind === 'agraFort' ||
    kind === 'tenshu' ||
    kind === 'foundry' ||
    kind === 'gurkha' ||
    kind === 'mahout' ||
    kind === 'siegeElephant' ||
    kind === 'redcoat' ||
    kind === 'dragoon' ||
    kind === 'falconet' ||
    kind === 'samurai' ||
    kind === 'naginata' ||
    kind === 'spahi' ||
    kind === 'greatBombard'
  ) {
    return 2
  }
  return 0
}

export function isRangedKind(kind: string): boolean {
  return (
    kind === 'sepoy' ||
    kind === 'gurkha' ||
    kind === 'longbowman' ||
    kind === 'redcoat' ||
    kind === 'dragoon' ||
    kind === 'falconet' ||
    kind === 'siegeElephant' ||
    kind === 'agraFort' ||
    kind === 'yumiArcher' ||
    kind === 'janissary' ||
    kind === 'greatBombard' ||
    kind === 'tenshu'
  )
}

export function isMusketKind(kind: string): boolean {
  return (
    kind === 'sepoy' ||
    kind === 'gurkha' ||
    kind === 'redcoat' ||
    kind === 'dragoon' ||
    kind === 'janissary'
  )
}

export function isSiegeKind(kind: string): boolean {
  return kind === 'falconet' || kind === 'siegeElephant' || kind === 'greatBombard'
}
