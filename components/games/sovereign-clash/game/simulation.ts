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
  PALISADE_BUILD_TIME,
  PROJECTILE_SPEED,
  SACRED_FIELD_BUILD_TIME,
  SACRED_FIELD_FOOD_PER_SEC,
  SIEGE_PROJECTILE_SPEED,
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
  isMilitary,
  isResource,
  isMusketKind,
  isRangedKind,
  isSiegeKind,
  isUnit,
  type Entity,
  type Team,
  type UnitKind,
} from './types'

function list(entities: Record<string, Entity>): Entity[] {
  return Object.values(entities)
}

function startDeath(e: Entity): void {
  if (e.dying) return
  e.dying = true
  e.deathTimer = DEATH_DURATION
  e.order = idleOrder()
  e.hp = 0
  if (e.kind === 'barracks' && e.team === 'enemy') {
    const s = useGameStore.getState()
    s.barracksRebuildAt = s.gameTime + BARRACKS_REBUILD
  }
  markHud()
}

function damageMultiplier(attacker: Entity, target: Entity): number {
  let m = 1
  const ac = isUnit(attacker) ? UNIT_CLASS[attacker.kind] : null
  const dc = isUnit(target) ? UNIT_CLASS[target.kind] : null
  if (ac === 'cavalry' && dc === 'rangedInf') m *= 1.6
  if ((ac === 'meleeInf' || attacker.kind === 'sepoy') && dc === 'cavalry') m *= 1.6
  if ((ac === 'siege' || attacker.kind === 'siegeElephant') && isBuilding(target)) m *= 3
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
  e.attackTimer = isSiegeKind(e.kind) ? ATTACK_COOLDOWN * 1.6 : ATTACK_COOLDOWN
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
    e.order = idleOrder()
    return
  }

  e.order.x = target.x
  e.order.z = target.z
  const d = dist(e.x, e.z, target.x, target.z)
  const range = e.attackRange

  if (d > range) {
    moveTowards(e, target.x, target.z, dt, entities, range, target.id)
    tickTrample(e, entities, dt)
    return
  }

  e.attackTimer -= dt
  fireAt(e, target, all, isRangedKind(e.kind))
}

function tickAttackMove(e: Entity, entities: Entity[], all: Record<string, Entity>, dt: number): void {
  const foe = nearest(
    e,
    entities,
    (o) => enemiesOf(e.team, o) && dist(e.x, e.z, o.x, o.z) <= ATTACK_MOVE_AGGRO,
  )
  if (foe) {
    const d = dist(e.x, e.z, foe.x, foe.z)
    if (d > e.attackRange) {
      moveTowards(e, foe.x, foe.z, dt, entities, e.attackRange, foe.id)
      tickTrample(e, entities, dt)
      return
    }
    e.attackTimer -= dt
    fireAt(e, foe, all, isRangedKind(e.kind))
    return
  }
  if (moveTowards(e, e.order.x, e.order.z, dt, entities, 0.4)) {
    e.order = idleOrder()
  } else {
    tickTrample(e, entities, dt)
  }
}

function tickTrample(e: Entity, entities: Entity[], dt: number): void {
  if (e.kind !== 'mahout' && e.kind !== 'siegeElephant') return
  e.gatherTimer += dt
  if (e.gatherTimer < 0.45) return
  e.gatherTimer = 0
  for (const o of entities) {
    if (!enemiesOf(e.team, o) || !isUnit(o)) continue
    if (dist(e.x, e.z, o.x, o.z) <= TRAMPLE_RADIUS + o.radius) {
      applyDamage(o, TRAMPLE_DAMAGE)
    }
  }
}

function nearestSameResource(
  from: { x: number; z: number },
  kind: Entity['kind'],
  entities: Entity[],
  maxDist = CHAIN_GATHER_RANGE,
  exceptId?: string | null,
): Entity | null {
  let best: Entity | null = null
  let bestD = maxDist
  for (const o of entities) {
    if (exceptId && o.id === exceptId) continue
    if (o.kind !== kind || o.dying || o.amount <= 0) continue
    const d = dist(from.x, from.z, o.x, o.z)
    if (d < bestD) {
      bestD = d
      best = o
    }
  }
  return best
}

function beginGather(e: Entity, node: Entity): void {
  e.gatherKind = node.kind as NonNullable<Entity['gatherKind']>
  e.order = { type: 'gather', x: node.x, z: node.z, targetId: node.id }
}

function beginReturn(e: Entity, last: { x: number; z: number; id: string | null }): void {
  e.order = { type: 'return', x: last.x, z: last.z, targetId: last.id }
}

function tryChainGather(
  e: Entity,
  from: { x: number; z: number },
  kind: Entity['kind'] | null,
  entities: Entity[],
  exceptId?: string | null,
): boolean {
  if (kind !== 'tree' && kind !== 'berryBush' && kind !== 'goldMine' && kind !== 'herd') return false
  const next = nearestSameResource(from, kind, entities, CHAIN_GATHER_RANGE, exceptId)
  if (!next) return false
  beginGather(e, next)
  return true
}

function goDropOrIdle(e: Entity, entities: Entity[], last: { x: number; z: number; id: string | null }): void {
  if (e.carryAmount > 0 && dropoffFor(e, entities)) {
    beginReturn(e, last)
  } else {
    e.order = idleOrder()
  }
}

function tickGather(e: Entity, entities: Entity[], all: Record<string, Entity>, dt: number): void {
  const node = e.order.targetId ? all[e.order.targetId] : null
  if (node && isResource(node)) e.gatherKind = node.kind as NonNullable<Entity['gatherKind']>

  if (!node || node.dying || node.amount <= 0) {
    const from = node ?? e
    const kind = node?.kind ?? e.gatherKind
    if (e.carryAmount < CARRY_CAPACITY - 0.01 && tryChainGather(e, from, kind, entities, node?.id)) {
      return
    }
    goDropOrIdle(e, entities, { x: from.x, z: from.z, id: node?.id ?? null })
    return
  }

  const reach = node.radius + GATHER_RANGE
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
  const reach = tc.radius + DROPOFF_RANGE
  const gap = dist(e.x, e.z, tc.x, tc.z)
  if (gap > reach) {
    const dx = e.x - tc.x
    const dz = e.z - tc.z
    const mag = Math.hypot(dx, dz) || 1
    const dropX = tc.x + (dx / mag) * (tc.radius + 1.1)
    const dropZ = tc.z + (dz / mag) * (tc.radius + 1.1)
    moveTowards(e, dropX, dropZ, dt, entities, 0.55, tc.id)
    return
  }
  if (e.carryResource && e.carryAmount > 0) {
    addResource(e.team, e.carryResource, Math.max(1, Math.round(e.carryAmount)))
    e.carryAmount = 0
    e.carryResource = null
  }
  const nodeId = e.order.targetId
  const node = nodeId ? all[nodeId] : null
  const from = node ?? { x: e.order.x, z: e.order.z }
  const kind = (node && isResource(node) ? node.kind : e.gatherKind) ?? e.gatherKind
  if (node && !node.dying && node.amount > 0) {
    beginGather(e, node)
  } else if (!tryChainGather(e, from, kind, entities, node?.id)) {
    e.order = idleOrder()
  }
}

function buildDuration(kind: Entity['kind']): number {
  if (kind === 'palisade') return PALISADE_BUILD_TIME
  if (kind === 'sacredField') return SACRED_FIELD_BUILD_TIME
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
  site.buildProgress = Math.min(1, site.buildProgress + dt / duration)
  site.hp = Math.min(site.maxHp, site.hp + (site.maxHp * dt) / duration)
  if (isComplete(site)) markHud()
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
  if (!isComplete(e) || e.dying || e.team !== 'player') return
  e.amount += SACRED_FIELD_FOOD_PER_SEC * dt
  if (e.amount >= 1) {
    const give = Math.floor(e.amount)
    e.amount -= give
    addResource('player', 'food', give)
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
    if (o.dying || o.kind === 'projectile') continue
    if (o.team === shooterTeam || o.team === 'neutral') continue
    if (!isUnit(o) && !isBuilding(o)) continue
    let dmg = amount
    if (isBuilding(o)) dmg *= 3
    if (dist(at.x, at.z, o.x, o.z) <= radius + o.radius) applyDamage(o, dmg)
  }
}

function tickProjectile(e: Entity, all: Record<string, Entity>, dt: number): void {
  const t = e.targetId ? all[e.targetId] : null
  if (!t || t.dying) {
    startDeath(e)
    return
  }
  const ty = e.splash > 0 ? 1.4 : 1.05
  const dx = t.x - e.x
  const dy = ty - e.y
  const dz = t.z - e.z
  const d = Math.hypot(dx, dy, dz) || 0.0001
  const step = (e.projectileSpeed || PROJECTILE_SPEED) * dt
  if (d < step + 0.4) {
    if (e.splash > 0) splashHit(t, e.team, all, e.splash, e.damage)
    else applyDamage(t, e.damage)
    startDeath(e)
    return
  }
  e.x += (dx / d) * step
  e.y += (dy / d) * step
  e.z += (dz / d) * step
}

function raidTarget(entities: Entity[]): Entity | null {
  const tc = entities.find(
    (e) => e.kind === 'townCenter' && e.team === 'player' && !e.dying,
  )
  if (tc) return tc
  return entities.find((e) => e.team === 'player' && (isUnit(e) || isBuilding(e)) && !e.dying) ?? null
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
    const r = tc.radius + 3.2
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
  markHud()
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

function replenishGuards(entities: Entity[]): void {
  const s = useGameStore.getState()
  if (s.enemyAge < 1) return
  const barracks = entities.find(
    (e) => e.kind === 'barracks' && e.team === 'enemy' && !e.dying && isComplete(e),
  )
  if (!barracks) return
  const guards = entities.filter((e) => e.guard && e.team === 'enemy' && !e.dying)
  if (guards.length >= s.guardCap) return
  const extra = spawnUnit('redcoat', 'enemy', barracks)
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
  const kinds: UnitKind[] = ['redcoat', 'pikeman']
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

function ensureEnemyBuilding(kind: 'barracks' | 'manor', spots: { x: number; z: number }[]): void {
  const s = useGameStore.getState()
  const live = Object.values(s.entities).find(
    (e) => e.kind === kind && e.team === 'enemy' && !e.dying,
  )
  if (live) return
  if (kind === 'barracks' && s.barracksRebuildAt > 0 && s.gameTime < s.barracksRebuildAt) return
  if (kind === 'barracks' && !spend(COSTS.barracks, 'enemy')) return
  const proxy: 'house' | 'barracks' = kind === 'manor' ? 'house' : 'barracks'
  const spot = spots.find((p) => isPlacementValid(p.x, p.z, proxy)) ?? spots[0]
  if (!spot) return
  const id = allocId()
  s.entities[id] = createBuilding(id, kind, 'enemy', spot.x, spot.z, true)
  s.worldEpoch += 1
  markHud()
}

function tickManors(dt: number): void {
  const s = useGameStore.getState()
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

function laterWaveRoster(waveIndex: number): UnitKind[] {
  const extra = Math.max(1, waveIndex - 3) * 4
  const kinds: UnitKind[] = [
    'redcoat',
    'redcoat',
    'redcoat',
    'redcoat',
    'redcoat',
    'redcoat',
    'redcoat',
    'redcoat',
    'dragoon',
    'dragoon',
    'dragoon',
    'dragoon',
    'falconet',
  ]
  const pool: UnitKind[] = ['redcoat', 'hussar', 'dragoon', 'pikeman']
  for (let i = 0; i < extra; i += 1) kinds.push(pool[i % pool.length])
  return kinds
}

function tickAi(dt: number): void {
  const s = useGameStore.getState()
  s.gameTime += dt
  s.aiTimer += dt
  tickManors(dt)

  if (s.gameTime >= AI_MANOR_TIME && s.enemyAge >= 0) {
    ensureEnemyBuilding('manor', [
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
  }

  const entities = list(s.entities)
  const prey = raidTarget(entities)

  if (s.waveIndex === 0 && s.gameTime >= AI_WAVE1_TIME) {
    s.waveStarted = true
    s.waveIndex = 1
    s.waveStartTime = s.gameTime
    sendRaid(
      spawnWave([
        'longbowman',
        'longbowman',
        'longbowman',
        'longbowman',
        'pikeman',
        'pikeman',
        'pikeman',
        'redcoat',
        'redcoat',
      ]),
      prey,
    )
    markHud()
  } else if (s.waveIndex === 1 && s.gameTime >= AI_WAVE2_TIME) {
    s.waveIndex = 2
    s.waveStartTime = s.gameTime
    sendRaid(
      spawnWave([
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
      ]),
      prey,
    )
    markHud()
  } else if (s.waveIndex === 2 && s.gameTime >= AI_WAVE3_TIME) {
    s.waveIndex = 3
    s.waveStartTime = s.gameTime
    sendRaid(
      spawnWave([
        'redcoat',
        'redcoat',
        'redcoat',
        'redcoat',
        'redcoat',
        'redcoat',
        'redcoat',
        'redcoat',
        'dragoon',
        'dragoon',
        'dragoon',
        'dragoon',
        'falconet',
      ]),
      prey,
    )
    markHud()
  } else if (s.waveIndex >= 3 && s.gameTime >= s.waveStartTime + AI_WAVE_INTERVAL) {
    s.waveIndex += 1
    s.waveStartTime = s.gameTime
    sendRaid(spawnWave(laterWaveRoster(s.waveIndex)), prey)
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
  const playerTc = ents.some(
    (e) => e.kind === 'townCenter' && e.team === 'player' && !e.dying,
  )
  const enemyTc = ents.some(
    (e) => e.kind === 'townCenter' && e.team === 'enemy' && !e.dying,
  )
  if (!playerTc) {
    s.winner = 'enemy'
    playSound('defeat')
    markHud()
  } else if (!enemyTc) {
    s.winner = 'player'
    playSound('fanfare')
    markHud()
  }
}

export function tick(dt: number): void {
  const s = useGameStore.getState()
  if (s.winner || s.helpOpen) return

  const all = s.entities
  const entities = list(all)
  const toRemove: string[] = []

  for (const e of entities) {
    if (e.dying) {
      e.deathTimer -= dt
      if (!isUnit(e)) e.scale = Math.max(0.01, e.deathTimer / DEATH_DURATION)
      if (e.deathTimer <= 0) toRemove.push(e.id)
      continue
    }

    if (e.kind === 'projectile') {
      tickProjectile(e, all, dt)
      continue
    }

    if (isBuilding(e)) {
      tickTraining(e, dt)
      if (e.kind === 'sacredField') tickSacredField(e, dt)
      if (e.kind === 'agraFort') tickTower(e, entities, all, dt)
      continue
    }

    if (!isUnit(e)) continue

    switch (e.order.type) {
      case 'move':
        if (moveTowards(e, e.order.x, e.order.z, dt, entities, 0.35)) {
          e.order = idleOrder()
        } else {
          tickTrample(e, entities, dt)
        }
        break
      case 'gather':
        tickGather(e, entities, all, dt)
        break
      case 'return':
        tickReturn(e, entities, all, dt)
        break
      case 'build':
        tickBuild(e, entities, all, dt)
        break
      case 'attack':
        tickCombat(e, entities, all, dt)
        break
      case 'attackMove':
        tickAttackMove(e, entities, all, dt)
        break
      default:
        if (e.team === 'enemy' && isMilitary(e) && e.hp >= e.maxHp) break
        autoAcquire(e, entities)
        break
    }
  }

  for (const id of toRemove) {
    s.selectedIds = s.selectedIds.filter((x) => x !== id)
    if (s.selectedId === id) s.selectedId = s.selectedIds[0] ?? null
    delete all[id]
    markHud()
  }

  tickAi(dt)
  if (s.aging) {
    s.ageTimer -= dt
    if (s.ageTimer <= 0) {
      s.aging = false
      s.playerAge = (s.playerAge + 1) as 1 | 2
      playSound('age')
      markHud()
    }
  }
  tickFog(list(s.entities))
  checkWinner()
}

if (process.env.NODE_ENV !== 'production') {
  ;(globalThis as unknown as { __aoeTick: typeof tick }).__aoeTick = tick
}
