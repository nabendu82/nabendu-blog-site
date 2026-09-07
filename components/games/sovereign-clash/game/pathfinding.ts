import { MAP_HALF } from './constants'
import { isBuilding, isResource, isUnit, type Entity } from './types'
import { activeTerrain, terrainGeneration, terrainRoute, drySegment } from './terrain'

const routes = new WeakMap<Entity, { generation: number; tx: number; tz: number; path: { x: number; z: number }[]; cursor: number }>()

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

export function dist2(ax: number, az: number, bx: number, bz: number): number {
  const dx = ax - bx
  const dz = az - bz
  return dx * dx + dz * dz
}

export function dist(ax: number, az: number, bx: number, bz: number): number {
  return Math.hypot(ax - bx, az - bz)
}

export function moveTowards(
  e: Entity,
  tx: number,
  tz: number,
  dt: number,
  others: Entity[],
  stopRange: number,
  ignoreId?: string,
): boolean {
  const terrain = activeTerrain()
  let finalX = tx, finalZ = tz
  if (terrain !== 'grassland') {
    let route = routes.get(e)
    if (!route || route.generation !== terrainGeneration() || Math.hypot(route.tx - tx, route.tz - tz) > 2) {
      route = { generation: terrainGeneration(), tx, tz, path: terrainRoute(terrain, e.x, e.z, tx, tz), cursor: 0 }
      routes.set(e, route)
    }
    if (!route.path.length) return false
    const end = route.path[route.path.length - 1]
    finalX = end.x; finalZ = end.z
    if (dist(e.x, e.z, finalX, finalZ) <= stopRange) return true
    while (route.cursor < route.path.length - 1 && dist(e.x, e.z, route.path[route.cursor].x, route.path[route.cursor].z) < 1.1 && drySegment(terrain, e.x, e.z, route.path[route.cursor + 1].x, route.path[route.cursor + 1].z, 1.7)) route.cursor++
    // Look ahead along the cached route without cutting corners into the water.
    for (let i = Math.min(route.path.length - 1, route.cursor + 6); i > route.cursor; i--) {
      if (drySegment(terrain, e.x, e.z, route.path[i].x, route.path[i].z, 1.7)) { route.cursor = i; break }
    }
    tx = route.path[route.cursor].x; tz = route.path[route.cursor].z
  }
  const remaining = dist(e.x, e.z, tx, tz)
  if (terrain === 'grassland' && remaining <= stopRange) return true
  if (remaining < 0.001) return false

  const speed = e.speed || 4
  let vx = ((tx - e.x) / remaining) * speed
  let vz = ((tz - e.z) / remaining) * speed

  for (const o of others) {
    if (o.id === e.id || o.id === ignoreId || o.dying || o.kind === 'projectile') continue
    if (!isBuilding(o) && !isUnit(o) && !isResource(o)) continue

    const minSep = e.radius + o.radius + (isBuilding(o) ? 0.2 : 0.08)
    const ox = e.x - o.x
    const oz = e.z - o.z
    const d = Math.hypot(ox, oz) || 0.0001
    const infl = isBuilding(o) ? minSep + 0.55 : minSep + 0.35
    if (d < infl) {
      const push = (infl - d) * (isBuilding(o) ? 6 : 4.5)
      vx += (ox / d) * push
      vz += (oz / d) * push
      const px = -oz / d
      const pz = ox / d
      const side = px * (tx - e.x) + pz * (tz - e.z) >= 0 ? 1 : -1
      vx += px * side * speed * 0.9
      vz += pz * side * speed * 0.9
    }
  }

  const mag = Math.hypot(vx, vz) || 1
  const step = Math.min(speed * dt, remaining)
  let nx = e.x + (vx / mag) * step, nz = e.z + (vz / mag) * step
  if (terrain !== 'grassland' && !drySegment(terrain, e.x, e.z, nx, nz, e.radius + 0.1)) {
    // Separation forces must never push a unit off a causeway or into a lake.
    nx = e.x + (tx - e.x) / remaining * step
    nz = e.z + (tz - e.z) / remaining * step
    if (!drySegment(terrain, e.x, e.z, nx, nz, e.radius + 0.1)) { routes.delete(e); return false }
  }
  e.x = nx
  e.z = nz
  e.facing = Math.atan2(vx, vz)
  e.x = clamp(e.x, -MAP_HALF + 1.2, MAP_HALF - 1.2)
  e.z = clamp(e.z, -MAP_HALF + 1.2, MAP_HALF - 1.2)

  return dist(e.x, e.z, finalX, finalZ) <= stopRange
}

export function nearest(
  from: Entity,
  list: Entity[],
  predicate: (e: Entity) => boolean,
): Entity | null {
  let best: Entity | null = null
  let bestD = Infinity
  for (const e of list) {
    if (!predicate(e)) continue
    const d = dist2(from.x, from.z, e.x, e.z)
    if (d < bestD) {
      bestD = d
      best = e
    }
  }
  return best
}
