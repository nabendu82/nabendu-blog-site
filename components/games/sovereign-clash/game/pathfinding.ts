import { MAP_HALF } from './constants'
import { isBuilding, isResource, isUnit, type Entity } from './types'

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
  const remaining = dist(e.x, e.z, tx, tz)
  if (remaining <= stopRange) return true

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
  e.x += (vx / mag) * speed * dt
  e.z += (vz / mag) * speed * dt
  e.facing = Math.atan2(vx, vz)
  e.x = clamp(e.x, -MAP_HALF + 1.2, MAP_HALF - 1.2)
  e.z = clamp(e.z, -MAP_HALF + 1.2, MAP_HALF - 1.2)

  return dist(e.x, e.z, tx, tz) <= stopRange
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
