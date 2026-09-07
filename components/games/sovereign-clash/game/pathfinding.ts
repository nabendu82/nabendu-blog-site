import { MAP_HALF } from './constants'
import { nearby } from './spatial'
import { isBuilding, isResource, isUnit, isShip, type Entity } from './types'
import { activeTerrain, terrainGeneration, terrainRoute, drySegment, bridgeHeight } from './terrain'

const routes = new WeakMap<Entity, { generation: number; tx: number; tz: number; path: { x: number; z: number }[]; cursor: number }>()

export function clearMovementRoute(e: Entity): void {
  routes.delete(e)
}

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
  const water = isShip(e)
  if(water && terrain==='grassland')return false
  const clear = (ax:number,az:number,bx:number,bz:number,r=1.7)=>drySegment(terrain,ax,az,bx,bz,r,water)
  let finalX = tx, finalZ = tz
  if (terrain !== 'grassland') {
    let route = routes.get(e)
    if (!route || route.generation !== terrainGeneration() || Math.hypot(route.tx - tx, route.tz - tz) > 2) {
      route = { generation: terrainGeneration(), tx, tz, path: terrainRoute(terrain, e.x, e.z, tx, tz,water,e.radius+0.1), cursor: 0 }
      routes.set(e, route)
    }
    if (!route.path.length) return false
    const end = route.path[route.path.length - 1]
    finalX = end.x; finalZ = end.z
    if (dist(e.x, e.z, finalX, finalZ) <= stopRange) return true
    while (route.cursor < route.path.length - 1 && dist(e.x, e.z, route.path[route.cursor].x, route.path[route.cursor].z) < 1.1 && clear(e.x, e.z, route.path[route.cursor + 1].x, route.path[route.cursor + 1].z)) route.cursor++
    // Look ahead along the cached route without cutting corners into the water.
    for (let i = Math.min(route.path.length - 1, route.cursor + 6); i > route.cursor; i--) {
      if (clear(e.x, e.z, route.path[i].x, route.path[i].z)) { route.cursor = i; break }
    }
    tx = route.path[route.cursor].x; tz = route.path[route.cursor].z
  }
  const remaining = dist(e.x, e.z, tx, tz)
  if (terrain === 'grassland' && remaining <= stopRange) return true
  if (remaining < 0.001) return false

  const speed = e.speed || 4
  let vx = ((tx - e.x) / remaining) * speed
  let vz = ((tz - e.z) / remaining) * speed

  for (const o of nearby(others,e.x,e.z,6)) {
    if (isUnit(o) && isShip(o) !== water) continue
    if (water && isResource(o)) continue
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
  if (terrain !== 'grassland' && !clear(e.x, e.z, nx, nz, e.radius + 0.1)) {
    // Separation forces must never push a unit off a causeway or into a lake.
    nx = e.x + (tx - e.x) / remaining * step
    nz = e.z + (tz - e.z) / remaining * step
    if (!clear(e.x, e.z, nx, nz, e.radius + 0.1)) { routes.delete(e); return false }
  }
  e.x = nx
  e.z = nz
  e.y = water ? 0 : bridgeHeight(terrain,e.x,e.z)
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
