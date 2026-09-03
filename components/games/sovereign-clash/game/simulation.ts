import {
  AGGRO_RANGE,
  AI_COMMERCE_TIME,
  AI_DEFEND_RANGE,
  AI_FORTRESS_TIME,
  AI_INTERVAL,
  AI_MANOR_TIME,
  AI_WAVE1_TIME,
  AI_WAVE2_TIME,
  AI_WAVE3_TIME,
  AI_WAVE_INTERVAL,
  ATTACK_COOLDOWN,
  ATTACK_MOVE_AGGRO,
  BARRACKS_REBUILD,
  BUILD_TIME,
  CARRY_CAPACITY,
  CHAIN_GATHER_RANGE,
  COSTS,
  DEATH_DURATION,
  DROPOFF_RANGE,
  ENEMY_BASE,
  GATHER_PER_SEC,
  GATHER_RANGE,
  MANOR_SETTLER_CAP,
  MANOR_SPAWN_INTERVAL,
  MOSQUE_HEAL_PER_SEC,
  MOSQUE_HEAL_RADIUS,
  OTTOMAN_VILLAGER_INTERVAL,
  PALISADE_BUILD_TIME,
  PROJECTILE_SPEED,
  SACRED_FIELD_BUILD_TIME,
  SACRED_FIELD_FOOD_PER_SEC,
  SIEGE_PROJECTILE_SPEED,
  TORII_SHRINE_TRICKLE_PER_SEC,
  TOWER_RANGE,
  TRAMPLE_DAMAGE,
  TRAMPLE_RADIUS,
  UNIT_CLASS,
} from './constants'
import { notifyCombat, playSound } from './audio'
import { tickFog } from './fog'
import { createBuilding, createProjectile, createUnit } from './mapGen'
import { dist, moveTowards, nearest } from './pathfinding'
import {
  addResource,
  allocId,
  isPlacementValid,
  markHud,
  spawnUnit,
  spend,
  useGameStore,
} from './store'
import {
  idleOrder,
  isBuilding,
  isComplete,
  isDropoff,
  isGatherable,
  isMilitary,
  isMusketKind,
  isSiegeKind,
  isUnit,
  type BuildingKind,
  type Civilization,
  type Entity,
  type Team,
  type UnitKind,
} from './types'

function list(map: Record<string, Entity>): Entity[] {
  return Object.values(map)
}

function startDeath(e: Entity): void {
  if (e.dying) return
  e.dying = true
  e.deathTimer = DEATH_DURATION
  e.order = idleOrder()
}

function damageMultiplier(attacker: Entity, target: Entity): number {
  let m = 1
  const ac = isUnit(attacker) ? UNIT_CLASS[attacker.kind] : null
  const dc = isUnit(target) ? UNIT_CLASS[target.kind] : null
  if (ac === 'cavalry' && dc === 'rangedInf') m *= 1.6
  if (
    (ac === 'meleeInf' ||
      attacker.kind === 'sepoy' ||
      attacker.kind === 'ashigaru' ||
      attacker.kind === 'pikeman') &&
    dc === 'cavalry'
  ) {
    m *= 1.65
  }
  if ((ac === 'siege' || attacker.kind === 'siegeElephant') && isBuilding(target)) m *= 3
  if (isBuilding(target)) {
    const s = useGameStore.getState()
    const civ = attacker.team === 'player' ? s.playerCiv : s.enemyCiv
    if (civ === 'ottoman' && isMusketKind(attacker.kind)) m *= 1.25 // Ottoman gunpowder siege bonus
  }
  return m
}

function applyDamage(e: Entity, amount: number): void {
  if (e.dying) return
  e.hp -= amount
  if (e.hp <= 0) startDeath(e)
}

function enemiesOf(team: Team, e: Entity): boolean {
  if (e.dying) return false
  if (team === 'player') return e.team === 'enemy' && (isUnit(e) || isBuilding(e))
  if (team === 'enemy') return e.team === 'player' && (isUnit(e) || isBuilding(e))
  return false
}

function dropoffFor(e: Entity, entities: Entity[]): Entity | null {
  const resource = e.carryResource
  return nearest(
    e,
    entities,
    (b) => b.team === e.team && isDropoff(b, resource),
  )
}

function autoAcquire(e: Entity, entities: Entity[]): void {
  if (e.order.type !== 'idle') return
  if (e.kind === 'villager') return
  const wave = useGameStore.getState().waveStarted
  const hunt = e.hp < e.maxHp || (e.team === 'player' && wave)
  const range = e.hp < e.maxHp ? 40 : hunt ? 26 : AGGRO_RANGE
  const foe = nearest(
    e,
    entities,
    (o) => enemiesOf(e.team, o) && dist(e.x, e.z, o.x, o.z) <= range,
  )
  if (foe) {
    e.order = { type: 'attack', x: foe.x, z: foe.z, targetId: foe.id }
  }
}

function fireAt(
  e: Entity,
  target: Entity,
  all: Record<string, Entity>,
  ranged: boolean,
): void {
  e.facing = Math.atan2(target.x - e.x, target.z - e.z)
  if (e.attackTimer > 0) return

  const s = useGameStore.getState()
  const civ = e.team === 'player' ? s.playerCiv : s.enemyCiv
  let cd = isSiegeKind(e.kind) ? ATTACK_COOLDOWN * 1.6 : ATTACK_COOLDOWN
  if (civ === 'japanese' && !ranged) {
    cd *= 0.75 // Bushido: 25% faster melee attacks!
  }
  e.attackTimer = cd

  notifyCombat()
  const dmg = e.attack * damageMultiplier(e, target)
  if (ranged) {
    const id = allocId()
    const splash = e.splash || 0
    const speed = isSiegeKind(e.kind) ? SIEGE_PROJECTILE_SPEED : PROJECTILE_SPEED
    all[id] = createProjectile(id, e.team, e.x, e.z, target.id, dmg, splash, speed)
    markHud()
    if (isSiegeKind(e.kind)) playSound('siege')
    else if (isMusketKind(e.kind)) playSound('musket')
    else playSound('bow')
  } else {
    applyDamage(target, dmg)
    playSound('sword')
  }
}

function tickCombat(e: Entity, entities: Entity[], all: Record<string, Entity>, dt: number): void {
  const target = e.order.targetId ? all[e.order.targetId] : null
  if (!target || target.dying) {
    const s = useGameStore.getState()
    if (e.team === 'enemy' && isMilitary(e) && s.waveStarted) {
      const prey = raidTarget(entities)
      if (prey) {
        e.order = { type: 'attack', x: prey.x, z: prey.z, targetId: prey.id }
        return
      }
    }
    const foe = nearest(
      e,
      entities,
      (o) => enemiesOf(e.team, o) && dist(e.x, e.z, o.x, o.z) <= AGGRO_RANGE,
    )
    if (foe) {
      e.order = { type: 'attack', x: foe.x, z: foe.z, targetId: foe.id }
      return
    }
    e.order = idleOrder()
    return
  }

  const reach = e.attackRange + target.radius + (isBuilding(target) ? 0.4 : 0.1)
  const d = dist(e.x, e.z, target.x, target.z)
  if (d > reach) {
    moveTowards(e, target.x, target.z, dt, entities, reach, target.id)
    return
  }
  fireAt(e, target, all, e.attackRange > 3.0)
}

function tickAttackMove(e: Entity, entities: Entity[], all: Record<string, Entity>, dt: number): void {
  const foe = nearest(
    e,
    entities,
    (o) => enemiesOf(e.team, o) && dist(e.x, e.z, o.x, o.z) <= ATTACK_MOVE_AGGRO,
  )
  if (foe) {
    fireAt(e, foe, all, e.attackRange > 3.0)
    return
  }
  if (moveTowards(e, e.order.x, e.order.z, dt, entities, 0.35)) {
    e.order = idleOrder()
  } else {
    tickTrample(e, entities, dt)
  }
}

function tickTrample(e: Entity, entities: Entity[], dt: number): void {
  if (e.kind !== 'mahout' && e.kind !== 'siegeElephant') return
  for (const o of entities) {
    if (!enemiesOf(e.team, o) || isBuilding(o) || o.dying) continue
    if (dist(e.x, e.z, o.x, o.z) <= TRAMPLE_RADIUS) {
      applyDamage(o, TRAMPLE_DAMAGE * dt)
    }
  }
}

function tickProjectile(
  p: Entity,
  all: Record<string, Entity>,
  dt: number,
): void {
  const target = p.targetId ? all[p.targetId] : null
  const tx = target ? target.x : p.order.x
  const tz = target ? target.z : p.order.z
  const dx = tx - p.x
  const dz = tz - p.z
  const d = Math.hypot(dx, dz)
  const step = (p.projectileSpeed || PROJECTILE_SPEED) * dt
  if (d <= step || d < 0.35) {
    if (p.splash && p.splash > 0) {
      splashHit(p, p.team, all, p.splash, p.damage)
    } else if (target && !target.dying) {
      applyDamage(target, p.damage)
    }
    p.dying = true
    p.deathTimer = 0.05
    return
  }
  p.x += (dx / d) * step
  p.z += (dz / d) * step
}

function tryChainGather(
  e: Entity,
  current: Entity,
  kind: Entity['kind'],
  entities: Entity[],
  excludeId: string,
): boolean {
  const next = nearest(
    current,
    entities,
    (o) =>
      o.id !== excludeId &&
      o.kind === kind &&
      !o.dying &&
      o.amount > 0 &&
      dist(current.x, current.z, o.x, o.z) <= CHAIN_GATHER_RANGE,
  )
  if (!next) return false
  e.order = { type: 'gather', x: next.x, z: next.z, targetId: next.id }
  e.gatherTimer = 0
  return true
}

function goDropOrIdle(e: Entity, entities: Entity[], fallback: { x: number; z: number; id: string | null }): void {
  const drop = dropoffFor(e, entities)
  if (drop) {
    e.order = { type: 'return', x: drop.x, z: drop.z, targetId: drop.id }
  } else {
    e.order = { type: 'idle', x: fallback.x, z: fallback.z, targetId: fallback.id }
  }
}

function tickGather(e: Entity, entities: Entity[], all: Record<string, Entity>, dt: number): void {
  const node = e.order.targetId ? all[e.order.targetId] : null
  if (!node || node.dying || node.amount <= 0) {
    if (node && tryChainGather(e, node, node.kind, entities, node.id)) return
    goDropOrIdle(e, entities, { x: e.x, z: e.z, id: null })
    return
  }

  const reach = GATHER_RANGE + node.radius
  if (dist(e.x, e.z, node.x, node.z) > reach) {
    moveTowards(e, node.x, node.z, dt, entities, reach, node.id)
    return
  }

  e.gatherTimer += dt
  const gained = GATHER_PER_SEC * dt
  const take = Math.min(gained, node.amount, CARRY_CAPACITY - e.carryAmount)
  if (take > 0) {
    node.amount -= take
    e.carryAmount += take
    e.carryResource = node.resourceType
    if (node.resourceType === 'wood') playSound('chop')
    else if (node.resourceType === 'gold') playSound('mine')
    else playSound('farm')
  }

  if (node.amount <= 0) startDeath(node)

  if (e.carryAmount >= CARRY_CAPACITY - 0.01) {
    goDropOrIdle(e, entities, { x: node.x, z: node.z, id: node.id })
    return
  }

  if (node.amount <= 0 || node.dying) {
    if (!tryChainGather(e, node, node.kind, entities, node.id)) {
      goDropOrIdle(e, entities, { x: node.x, z: node.z, id: node.id })
    }
  }
}

function tickReturn(e: Entity, entities: Entity[], all: Record<string, Entity>, dt: number): void {
  const tc = dropoffFor(e, entities)
  if (!tc) {
    e.order = idleOrder()
    return
  }
  const reach = DROPOFF_RANGE + tc.radius
  if (dist(e.x, e.z, tc.x, tc.z) > reach) {
    moveTowards(e, tc.x, tc.z, dt, entities, reach, tc.id)
    return
  }
  if (e.carryAmount > 0 && e.carryResource) {
    addResource(e.team, e.carryResource, e.carryAmount)
    e.carryAmount = 0
  }
  const prev = e.order.targetId ? all[e.order.targetId] : null
  if (prev && isGatherable(prev)) {
    e.order = { type: 'gather', x: prev.x, z: prev.z, targetId: prev.id }
    e.gatherTimer = 0
  } else {
    e.order = idleOrder()
  }
}

function buildDuration(kind: Entity['kind']): number {
  if (kind === 'palisade') return PALISADE_BUILD_TIME
  if (kind === 'sacredField' || kind === 'toriiShrine') return SACRED_FIELD_BUILD_TIME
  return BUILD_TIME
}

function tickBuild(e: Entity, entities: Entity[], all: Record<string, Entity>, dt: number): void {
  const site = e.order.targetId ? all[e.order.targetId] : null
  if (!site || site.dying) {
    e.order = idleOrder()
    return
  }
  const reach = site.radius + 1.1
  if (dist(e.x, e.z, site.x, site.z) > reach) {
    moveTowards(e, site.x, site.z, dt, entities, reach, site.id)
    return
  }
  if (isComplete(site)) {
    e.order = idleOrder()
    return
  }
  const duration = buildDuration(site.kind)
  const prevComplete = site.buildProgress >= 1
  site.buildProgress = Math.min(1, site.buildProgress + dt / duration)
  site.hp = Math.min(site.maxHp, site.hp + (site.maxHp * dt) / duration)

  if (!prevComplete && site.buildProgress >= 1) {
    markHud()
    playSound('spawn')
    // British Manor bonus: free Settler on construction
    if (site.kind === 'manor') {
      spawnUnit('villager', site.team, site)
    }
  }
}

function tickTraining(b: Entity, dt: number): void {
  if (!isComplete(b) || b.dying || b.trainQueue.length === 0) return
  const job = b.trainQueue[0]
  job.remaining -= dt
  if (job.remaining > 0) return
  b.trainQueue.shift()
  spawnUnit(job.kind, b.team, b)
  playSound('spawn')
}

function tickSacredField(e: Entity, dt: number): void {
  if (!isComplete(e) || e.dying) return
  e.amount += SACRED_FIELD_FOOD_PER_SEC * dt
  if (e.amount >= 1) {
    const give = Math.floor(e.amount)
    e.amount -= give
    addResource(e.team, 'food', give)
    addResource(e.team, 'gold', Math.floor(give * 0.5))
  }
}

function tickToriiShrine(e: Entity, dt: number): void {
  if (!isComplete(e) || e.dying) return
  e.amount += TORII_SHRINE_TRICKLE_PER_SEC * dt
  if (e.amount >= 1) {
    const give = Math.floor(e.amount)
    e.amount -= give
    addResource(e.team, 'food', give)
    addResource(e.team, 'gold', give)
  }
}

function tickMosque(e: Entity, entities: Entity[], dt: number): void {
  if (!isComplete(e) || e.dying) return
  const healAmount = MOSQUE_HEAL_PER_SEC * dt
  for (const u of entities) {
    if (u.team === e.team && isUnit(u) && !u.dying && u.hp < u.maxHp) {
      if (dist(e.x, e.z, u.x, u.z) <= MOSQUE_HEAL_RADIUS) {
        u.hp = Math.min(u.maxHp, u.hp + healAmount)
      }
    }
  }
}

function tickOttomanAutoVillager(b: Entity, dt: number): void {
  if (b.kind !== 'townCenter' || !isComplete(b) || b.dying) return
  const s = useGameStore.getState()
  const civ = b.team === 'player' ? s.playerCiv : s.enemyCiv
  if (civ !== 'ottoman') return
  b.gatherTimer += dt
  if (b.gatherTimer >= OTTOMAN_VILLAGER_INTERVAL) {
    b.gatherTimer = 0
    spawnUnit('villager', b.team, b)
    if (b.team === 'player') playSound('spawn')
  }
}

function tickTower(e: Entity, entities: Entity[], all: Record<string, Entity>, dt: number): void {
  if (!isComplete(e) || e.dying) return
  e.attackTimer -= dt
  const foe = nearest(
    e,
    entities,
    (o) => enemiesOf(e.team, o) && dist(e.x, e.z, o.x, o.z) <= (e.attackRange || TOWER_RANGE),
  )
  if (!foe) return
  fireAt(e, foe, all, true)
}

function splashHit(
  at: Entity,
  shooterTeam: Team,
  all: Record<string, Entity>,
  radius: number,
  amount: number,
): void {
  for (const o of Object.values(all)) {
    if (!enemiesOf(shooterTeam, o) || o.dying) continue
    if (dist(at.x, at.z, o.x, o.z) <= radius) {
      applyDamage(o, amount)
    }
  }
}

function raidTarget(entities: Entity[]): Entity | null {
  const tc = entities.find((e) => e.kind === 'townCenter' && e.team === 'player' && !e.dying)
  if (tc) return tc
  return (
    entities.find((e) => isBuilding(e) && e.team === 'player' && !e.dying) ??
    entities.find((e) => isUnit(e) && e.team === 'player' && !e.dying) ??
    null
  )
}

function sendRaid(units: Entity[], target: Entity | null): void {
  if (!target) return
  notifyCombat()
  playSound('raid')
  for (const u of units) {
    if (u.guard) continue
    u.order = { type: 'attack', x: target.x, z: target.z, targetId: target.id }
  }
}

function spawnWave(kinds: UnitKind[]): Entity[] {
  const s = useGameStore.getState()
  const tc = Object.values(s.entities).find(
    (e) => e.kind === 'townCenter' && e.team === 'enemy' && !e.dying,
  )
  if (!tc) return []
  const spawned: Entity[] = []
  kinds.forEach((kind, i) => {
    const ang = (i / Math.max(1, kinds.length)) * Math.PI * 1.6 + 0.4
    const r = tc.radius + 3.2 + Math.floor(i / 6) * 1.6
    const id = allocId()
    const unit = createUnit(
      id,
      kind,
      'enemy',
      tc.x - Math.cos(ang) * r,
      tc.z - Math.sin(ang) * r,
    )
    s.entities[id] = unit
    spawned.push(unit)
  })
  s.worldEpoch += 1
  return spawned
}

function assignEnemyGather(entities: Entity[]): void {
  const idle = entities.filter(
    (e) => e.kind === 'villager' && e.team === 'enemy' && !e.dying && e.order.type === 'idle',
  )
  for (const v of idle) {
    const node = nearest(
      v,
      entities,
      (o) =>
        !o.dying &&
        o.amount > 10 &&
        (o.kind === 'tree' || o.kind === 'berryBush' || o.kind === 'goldMine' || o.kind === 'herd'),
    )
    if (node) {
      v.order = { type: 'gather', x: node.x, z: node.z, targetId: node.id }
    }
  }
}

function guardPost(tc: Entity, index: number, total: number): { x: number; z: number } {
  const n = Math.max(4, total)
  const ang = (index / n) * Math.PI * 2 + 0.5
  const ring = Math.floor(index / 8)
  const r = tc.radius + 4.2 + ring * 1.7
  return { x: tc.x + Math.cos(ang) * r, z: tc.z + Math.sin(ang) * r }
}

function defendEnemyBase(entities: Entity[]): void {
  const tc = entities.find((e) => e.kind === 'townCenter' && e.team === 'enemy' && !e.dying)
  if (!tc) return
  const threat = nearest(
    tc,
    entities,
    (o) =>
      o.team === 'player' &&
      !o.dying &&
      (isUnit(o) || isBuilding(o)) &&
      dist(tc.x, tc.z, o.x, o.z) <= AI_DEFEND_RANGE,
  )
  const guards = entities.filter((e) => e.guard && e.team === 'enemy' && !e.dying)

  if (threat) {
    for (const u of entities) {
      if (u.team !== 'enemy' || !isMilitary(u) || u.dying) continue
      if (!u.guard && dist(u.x, u.z, tc.x, tc.z) > 28) continue
      u.order = { type: 'attack', x: threat.x, z: threat.z, targetId: threat.id }
    }
    return
  }

  guards.forEach((g, i) => {
    const post = guardPost(tc, i, guards.length)
    if (dist(g.x, g.z, post.x, post.z) > 1.4) {
      g.order = { type: 'move', x: post.x, z: post.z, targetId: null }
    } else if (g.order.type !== 'idle') {
      g.order = idleOrder()
    }
  })
}

function civGuardUnit(civ: Civilization): UnitKind {
  switch (civ) {
    case 'indian':
      return 'sepoy'
    case 'japanese':
      return 'samurai'
    case 'ottoman':
      return 'janissary'
    case 'british':
    default:
      return 'redcoat'
  }
}

function civGuardPair(civ: Civilization): UnitKind[] {
  switch (civ) {
    case 'indian':
      return ['sepoy', 'rajput']
    case 'japanese':
      return ['samurai', 'ashigaru']
    case 'ottoman':
      return ['janissary', 'bashiBazouk']
    case 'british':
    default:
      return ['redcoat', 'pikeman']
  }
}

function replenishGuards(entities: Entity[]): void {
  const s = useGameStore.getState()
  if (s.enemyAge < 1) return
  const barracks = entities.find(
    (e) => e.kind === 'barracks' && e.team === 'enemy' && !e.dying && isComplete(e),
  )
  if (!barracks) return
  const guards = entities.filter((e) => e.guard && e.team === 'enemy' && !e.dying)
  if (guards.length >= s.guardCap) return
  const extra = spawnUnit(civGuardUnit(s.enemyCiv), 'enemy', barracks)
  extra.guard = true
  extra.order = idleOrder()
}

function addTownHallGuards(count: number): void {
  const s = useGameStore.getState()
  const tc = Object.values(s.entities).find(
    (e) => e.kind === 'townCenter' && e.team === 'enemy' && !e.dying,
  )
  if (!tc) return
  const existing = Object.values(s.entities).filter(
    (e) => e.guard && e.team === 'enemy' && !e.dying,
  ).length
  const kinds: UnitKind[] = civGuardPair(s.enemyCiv)
  for (let i = 0; i < count; i += 1) {
    const n = existing + i
    const ang = (n / Math.max(6, existing + count)) * Math.PI * 2 + 0.5
    const r = tc.radius + 4.2 + Math.floor(n / 8) * 1.7
    const id = allocId()
    const unit = createUnit(
      id,
      kinds[i % kinds.length],
      'enemy',
      tc.x + Math.cos(ang) * r,
      tc.z + Math.sin(ang) * r,
    )
    unit.guard = true
    s.entities[id] = unit
  }
  s.guardCap += count
  s.worldEpoch += 1
  markHud()
}

function civUniqueBuilding(civ: Civilization): BuildingKind {
  switch (civ) {
    case 'indian':
      return 'sacredField'
    case 'japanese':
      return 'toriiShrine'
    case 'ottoman':
      return 'mosque'
    case 'british':
    default:
      return 'manor'
  }
}

function ensureEnemyBuilding(
  kind: BuildingKind,
  spots: { x: number; z: number }[],
): void {
  const s = useGameStore.getState()
  const live = Object.values(s.entities).find(
    (e) => e.kind === kind && e.team === 'enemy' && !e.dying,
  )
  if (live) return
  if (kind === 'barracks' && s.barracksRebuildAt > 0 && s.gameTime < s.barracksRebuildAt) return
  if (kind === 'barracks' && !spend(COSTS.barracks, 'enemy')) return
  const proxy: 'house' | 'barracks' =
    kind === 'manor' || kind === 'sacredField' || kind === 'toriiShrine' || kind === 'mosque'
      ? 'house'
      : 'barracks'
  const spot = spots.find((p) => isPlacementValid(p.x, p.z, proxy)) ?? spots[0]
  if (!spot) return
  const id = allocId()
  s.entities[id] = createBuilding(id, kind, 'enemy', spot.x, spot.z, true)
  s.worldEpoch += 1
  markHud()
}

function tickManors(dt: number): void {
  const s = useGameStore.getState()
  if (s.enemyCiv !== 'british') return
  const manors = Object.values(s.entities).filter(
    (e) => e.kind === 'manor' && e.team === 'enemy' && !e.dying && isComplete(e),
  )
  if (manors.length === 0) return
  s.manorTimer += dt
  if (s.manorTimer < MANOR_SPAWN_INTERVAL) return
  s.manorTimer = 0
  const settlers = Object.values(s.entities).filter(
    (e) => e.kind === 'villager' && e.team === 'enemy' && !e.dying,
  )
  if (settlers.length >= MANOR_SETTLER_CAP) return
  spawnUnit('villager', 'enemy', manors[0])
}

function civWave(civ: Civilization, waveNumber: 1 | 2 | 3): UnitKind[] {
  switch (civ) {
    case 'indian':
      if (waveNumber === 1) {
        return ['gurkha', 'gurkha', 'gurkha', 'rajput', 'rajput', 'rajput', 'sepoy', 'sepoy']
      }
      if (waveNumber === 2) {
        return ['sepoy', 'sepoy', 'sepoy', 'sepoy', 'sowar', 'sowar', 'sowar', 'rajput', 'rajput']
      }
      return [
        'sepoy',
        'sepoy',
        'sepoy',
        'sepoy',
        'sowar',
        'sowar',
        'mahout',
        'siegeElephant',
      ]

    case 'japanese':
      if (waveNumber === 1) {
        return [
          'yumiArcher',
          'yumiArcher',
          'ashigaru',
          'ashigaru',
          'ashigaru',
          'samurai',
          'samurai',
        ]
      }
      if (waveNumber === 2) {
        return [
          'samurai',
          'samurai',
          'samurai',
          'samurai',
          'naginata',
          'naginata',
          'yumiArcher',
          'yumiArcher',
        ]
      }
      return [
        'samurai',
        'samurai',
        'samurai',
        'samurai',
        'samurai',
        'naginata',
        'naginata',
        'naginata',
        'yumiArcher',
        'yumiArcher',
      ]

    case 'ottoman':
      if (waveNumber === 1) {
        return ['janissary', 'janissary', 'janissary', 'bashiBazouk', 'bashiBazouk', 'bashiBazouk']
      }
      if (waveNumber === 2) {
        return [
          'janissary',
          'janissary',
          'janissary',
          'janissary',
          'spahi',
          'spahi',
          'spahi',
          'bashiBazouk',
        ]
      }
      return [
        'janissary',
        'janissary',
        'janissary',
        'janissary',
        'janissary',
        'spahi',
        'spahi',
        'greatBombard',
      ]

    case 'british':
    default:
      if (waveNumber === 1) {
        return [
          'longbowman',
          'longbowman',
          'longbowman',
          'longbowman',
          'pikeman',
          'pikeman',
          'pikeman',
          'redcoat',
          'redcoat',
        ]
      }
      if (waveNumber === 2) {
        return [
          'redcoat',
          'redcoat',
          'redcoat',
          'redcoat',
          'redcoat',
          'redcoat',
          'hussar',
          'hussar',
          'hussar',
          'hussar',
        ]
      }
      return [
        'redcoat',
        'redcoat',
        'redcoat',
        'redcoat',
        'redcoat',
        'redcoat',
        'dragoon',
        'dragoon',
        'dragoon',
        'falconet',
      ]
  }
}

function laterWaveRoster(waveIndex: number, civ: Civilization): UnitKind[] {
  const extra = Math.max(1, waveIndex - 3) * 4
  const poolMap: Record<Civilization, { core: UnitKind[]; siege: UnitKind }> = {
    indian: {
      core: ['sepoy', 'rajput', 'sowar', 'gurkha', 'mahout'],
      siege: 'siegeElephant',
    },
    british: {
      core: ['redcoat', 'hussar', 'dragoon', 'pikeman', 'longbowman'],
      siege: 'falconet',
    },
    japanese: {
      core: ['samurai', 'naginata', 'yumiArcher', 'ashigaru'],
      siege: 'naginata',
    },
    ottoman: {
      core: ['janissary', 'spahi', 'bashiBazouk'],
      siege: 'greatBombard',
    },
  }
  const config = poolMap[civ] ?? poolMap.british
  const kinds: UnitKind[] = []
  for (let i = 0; i < 8 + extra; i += 1) {
    kinds.push(config.core[i % config.core.length])
  }
  kinds.push(config.siege)
  return kinds
}

function tickAi(dt: number): void {
  const s = useGameStore.getState()
  s.gameTime += dt
  s.aiTimer += dt
  tickManors(dt)

  if (s.gameTime >= AI_MANOR_TIME && s.enemyAge >= 0) {
    const uniqueBuilding = civUniqueBuilding(s.enemyCiv)
    ensureEnemyBuilding(uniqueBuilding, [
      { x: ENEMY_BASE.x - 6.5, z: ENEMY_BASE.z + 4.2 },
      { x: ENEMY_BASE.x + 5.5, z: ENEMY_BASE.z - 6 },
    ])
  }

  if (s.enemyAge < 1 && s.gameTime >= AI_COMMERCE_TIME) {
    s.enemyAge = 1
    markHud()
  }

  if (s.enemyAge >= 1) {
    ensureEnemyBuilding('barracks', [
      { x: ENEMY_BASE.x - 5.5, z: ENEMY_BASE.z + 1.2 },
      { x: ENEMY_BASE.x - 6.5, z: ENEMY_BASE.z - 2.2 },
      { x: ENEMY_BASE.x + 1.5, z: ENEMY_BASE.z - 5.5 },
    ])
  }

  if (s.enemyAge < 2 && s.gameTime >= AI_FORTRESS_TIME) {
    s.enemyAge = 2
    markHud()
    if (s.enemyCiv === 'indian') {
      ensureEnemyBuilding('agraFort', [{ x: ENEMY_BASE.x - 8.5, z: ENEMY_BASE.z - 8.5 }])
    } else if (s.enemyCiv === 'japanese') {
      ensureEnemyBuilding('tenshu', [{ x: ENEMY_BASE.x - 8.5, z: ENEMY_BASE.z - 8.5 }])
    } else {
      ensureEnemyBuilding('foundry', [{ x: ENEMY_BASE.x - 8.5, z: ENEMY_BASE.z - 8.5 }])
    }
  }

  const entities = list(s.entities)
  const prey = raidTarget(entities)

  if (s.waveIndex === 0 && s.gameTime >= AI_WAVE1_TIME) {
    s.waveStarted = true
    s.waveIndex = 1
    s.waveStartTime = s.gameTime
    sendRaid(spawnWave(civWave(s.enemyCiv, 1)), prey)
    markHud()
  } else if (s.waveIndex === 1 && s.gameTime >= AI_WAVE2_TIME) {
    s.waveIndex = 2
    s.waveStartTime = s.gameTime
    sendRaid(spawnWave(civWave(s.enemyCiv, 2)), prey)
    markHud()
  } else if (s.waveIndex === 2 && s.gameTime >= AI_WAVE3_TIME) {
    s.waveIndex = 3
    s.waveStartTime = s.gameTime
    sendRaid(spawnWave(civWave(s.enemyCiv, 3)), prey)
    markHud()
  } else if (s.waveIndex >= 3 && s.gameTime >= s.waveStartTime + AI_WAVE_INTERVAL) {
    s.waveIndex += 1
    s.waveStartTime = s.gameTime
    sendRaid(spawnWave(laterWaveRoster(s.waveIndex, s.enemyCiv)), prey)
    addTownHallGuards(2)
    markHud()
  }

  defendEnemyBase(entities)

  if (s.aiTimer < AI_INTERVAL) return
  s.aiTimer = 0

  s.enemyWood += 16
  s.enemyFood += 22
  s.enemyGold += 12
  markHud()

  assignEnemyGather(entities)
  replenishGuards(entities)
}

function checkWinner(): void {
  const s = useGameStore.getState()
  if (s.winner) return
  const ents = list(s.entities)
  const enemyTc = ents.find(
    (e) => e.kind === 'townCenter' && e.team === 'enemy' && !e.dying,
  )
  const playerTc = ents.find(
    (e) => e.kind === 'townCenter' && e.team === 'player' && !e.dying,
  )

  if (!enemyTc) {
    s.winner = 'player'
    markHud()
    playSound('fanfare')
  } else if (!playerTc) {
    s.winner = 'enemy'
    markHud()
    playSound('defeat')
  }
}

export function tickSimulation(dt: number): void {
  const clampedDt = Math.min(0.1, Math.max(0.001, dt))
  const s = useGameStore.getState()
  const all = s.entities
  const entities = list(all)

  if (s.aging) {
    s.ageTimer -= clampedDt
    if (s.ageTimer <= 0) {
      s.aging = false
      s.ageTimer = 0
      s.playerAge = (s.playerAge + 1) as 0 | 1 | 2
      markHud()
      playSound('age')
    }
  }

  for (const e of entities) {
    if (e.dying) {
      e.deathTimer -= clampedDt
      if (e.deathTimer <= 0) {
        delete all[e.id]
        s.worldEpoch += 1
        markHud()
      }
      continue
    }

    if (e.kind === 'projectile') {
      tickProjectile(e, all, clampedDt)
      continue
    }

    if (isBuilding(e)) {
      tickTraining(e, clampedDt)
      if (e.kind === 'townCenter') tickOttomanAutoVillager(e, clampedDt)
      if (e.kind === 'sacredField') tickSacredField(e, clampedDt)
      if (e.kind === 'toriiShrine') tickToriiShrine(e, clampedDt)
      if (e.kind === 'mosque') tickMosque(e, entities, clampedDt)
      if (e.kind === 'agraFort' || e.kind === 'tenshu') tickTower(e, entities, all, clampedDt)
      continue
    }

    if (!isUnit(e)) continue

    switch (e.order.type) {
      case 'move':
        if (moveTowards(e, e.order.x, e.order.z, clampedDt, entities, 0.35)) {
          e.order = idleOrder()
        } else {
          tickTrample(e, entities, clampedDt)
        }
        break
      case 'gather':
        tickGather(e, entities, all, clampedDt)
        break
      case 'return':
        tickReturn(e, entities, all, clampedDt)
        break
      case 'build':
        tickBuild(e, entities, all, clampedDt)
        break
      case 'attack':
        tickCombat(e, entities, all, clampedDt)
        break
      case 'attackMove':
        tickAttackMove(e, entities, all, clampedDt)
        break
      default:
        if (e.team === 'enemy' && isMilitary(e) && e.hp >= e.maxHp) break
        autoAcquire(e, entities)
        break
    }
  }

  tickAi(clampedDt)
  checkWinner()
}

export const tick = tickSimulation
