import { MAP_HALF } from './constants'

export type TerrainKind = 'grassland' | 'lake' | 'river' | 'oasis'
export const TERRAINS: Record<TerrainKind, { name: string; description: string; land: string; water: string }> = {
  grassland: { name: 'Emerald Plains', description: 'The original forested battlefield. Open routes and room to expand.', land: '#5c9a4a', water: '#338b9f' },
  lake: { name: 'Great Lake', description: 'A broad central lake. March around either shore to reach your rival.', land: '#729457', water: '#327f9c' },
  river: { name: 'Two Crossings', description: 'A winding river divides the map. Only two stone causeways connect the banks.', land: '#668e50', water: '#388d9d' },
  oasis: { name: 'Amber Oasis', description: 'Golden dunes, palm groves and two turquoise pools. Open central trade routes.', land: '#c7aa70', water: '#319c9c' },
}
export const CROSSINGS = [-32, 32] as const
export const riverCenter = (z: number) => Math.sin(z / 22) * 7
export function isWater(kind: TerrainKind, x: number, z: number): boolean {
  if (kind === 'lake') return (x / 29) ** 2 + (z / 35) ** 2 < 1
  if (kind === 'river') return Math.abs(x - riverCenter(z)) < 7 && !CROSSINGS.some(c => Math.abs(z - c) <= 5)
  if (kind === 'oasis') return ((x + 24) / 16) ** 2 + ((z - 13) / 22) ** 2 < 1 || ((x - 24) / 16) ** 2 + ((z + 13) / 22) ** 2 < 1
  return false
}
export function isCrossing(kind: TerrainKind, x: number, z: number): boolean {
  return kind === 'river' && Math.abs(x - riverCenter(z)) < 10 && CROSSINGS.some(c => Math.abs(z - c) <= 5)
}

// Shared by terrain generation, collision, placement and the renderer.
export function isDry(kind: TerrainKind, x: number, z: number, radius = 0): boolean {
  if (Math.abs(x) + radius > MAP_HALF - 0.5 || Math.abs(z) + radius > MAP_HALF - 0.5 || isWater(kind, x, z)) return false
  if (kind === 'grassland' || radius <= 0) return true
  for (let i = 0; i < 16; i++) {
    const a = i * Math.PI / 8
    if (isWater(kind, x + Math.cos(a) * radius, z + Math.sin(a) * radius)) return false
  }
  return true
}
let active: TerrainKind = 'grassland'
let generation = 0
export function setActiveTerrain(kind: TerrainKind): void { active = kind; generation++ }
export function activeTerrain(): TerrainKind { return active }
export function terrainGeneration(): number { return generation }

export function nearestDry(kind: TerrainKind, x: number, z: number, radius = 1.3): { x: number; z: number } {
  x = Math.max(-78 + radius, Math.min(78 - radius, x))
  z = Math.max(-78 + radius, Math.min(78 - radius, z))
  if (isDry(kind, x, z, radius)) return { x, z }
  for (let r = 1; r < 100; r++) for (let i = 0; i < 64; i++) {
    const a = i * Math.PI / 32
    const p = { x: x + Math.cos(a) * r, z: z + Math.sin(a) * r }
    if (isDry(kind, p.x, p.z, radius)) return p
  }
  return { x: -55, z: -55 }
}

export function drySegment(kind: TerrainKind, ax: number, az: number, bx: number, bz: number, radius = 1.7): boolean {
  const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.2))
  for (let i = 0; i <= steps; i++) if (!isDry(kind, ax + (bx - ax) * i / steps, az + (bz - az) * i / steps, radius)) return false
  return true
}

const CELL = 2
const N = 79
const coord = (i: number) => -78 + i * CELL
const index = (x: number, z: number) => Math.max(0, Math.min(N - 1, Math.round((z + 78) / CELL))) * N + Math.max(0, Math.min(N - 1, Math.round((x + 78) / CELL)))
const point = (i: number) => ({ x: coord(i % N), z: coord(Math.floor(i / N)) })
const masks = new Map<TerrainKind, Uint8Array>()

/** A* on a conservative grid; diagonals cannot cut across shoreline corners. */
export function terrainRoute(kind: TerrainKind, ax: number, az: number, tx: number, tz: number): { x: number; z: number }[] {
  const goal = nearestDry(kind, tx, tz, 1.7)
  if (drySegment(kind, ax, az, goal.x, goal.z)) return [goal]
  let mask = masks.get(kind)
  if (!mask) {
    mask = new Uint8Array(N * N)
    for (let i = 0; i < mask.length; i++) { const p = point(i); mask[i] = isDry(kind, p.x, p.z, 1.7) ? 1 : 0 }
    masks.set(kind, mask)
  }
  const validIndex = (x: number, z: number) => {
    let best = -1, distance = Infinity
    for (let i = 0; i < mask!.length; i++) if (mask![i]) {
      const p = point(i), d = (p.x - x) ** 2 + (p.z - z) ** 2
      if (d < distance && drySegment(kind, x, z, p.x, p.z, 1.25)) { best = i; distance = d }
    }
    return best
  }
  let start = index(ax, az), end = index(goal.x, goal.z)
  if (!mask[start] || !drySegment(kind, ax, az, point(start).x, point(start).z, 1.25)) start = validIndex(ax, az)
  if (!mask[end]) end = validIndex(goal.x, goal.z)
  if (start < 0 || end < 0) return []
  const g = new Float64Array(N * N).fill(Infinity)
  const parent = new Int32Array(N * N).fill(-1)
  const closed = new Uint8Array(N * N)
  const open = new Set<number>([start])
  g[start] = 0
  const heuristic = (i: number) => Math.hypot(i % N - end % N, Math.floor(i / N) - Math.floor(end / N))
  while (open.size) {
    let current = -1, best = Infinity
    for (const i of open) { const f = g[i] + heuristic(i); if (f < best) { current = i; best = f } }
    if (current === end) {
      const path = [goal]
      for (let i = end; i !== start; i = parent[i]) path.push(point(i))
      path.push(point(start))
      path.reverse()
      return path
    }
    open.delete(current); closed[current] = 1
    const cx = current % N, cz = Math.floor(current / N)
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const x = cx + dx, z = cz + dz, next = z * N + x
      if ((!dx && !dz) || x < 0 || z < 0 || x >= N || z >= N || !mask[next] || closed[next]) continue
      if (dx && dz && (!mask[cz * N + x] || !mask[z * N + cx])) continue
      const cost = g[current] + Math.hypot(dx, dz)
      if (cost < g[next]) { g[next] = cost; parent[next] = current; open.add(next) }
    }
  }
  return []
}
