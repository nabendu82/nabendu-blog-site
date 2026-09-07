import { MAP_HALF } from './constants'

export type TerrainKind = 'grassland' | 'lake' | 'river' | 'oasis'
export const TERRAINS: Record<TerrainKind, { name: string; description: string; land: string; water: string }> = {
  grassland: { name: 'Emerald Plains', description: 'The original forested battlefield. Open routes and room to expand.', land: '#5c9a4a', water: '#338b9f' },
  lake: { name: 'Great Lake', description: 'A broad central lake. March around either shore to reach your rival.', land: '#729457', water: '#327f9c' },
  river: { name: 'Two Crossings', description: 'A winding river divides the map. Two stone bridges connect the banks; ships sail underneath.', land: '#668e50', water: '#388d9d' },
  oasis: { name: 'Amber Oasis', description: 'Golden dunes, palm groves and two turquoise pools. Open central trade routes.', land: '#c7aa70', water: '#319c9c' },
}
export const CROSSINGS = [-32, 32] as const
export const riverCenter = (z: number) => Math.sin(z / 22) * 7
export function sameWater(kind: TerrainKind, a: {x:number;z:number}, b: {x:number;z:number}): boolean {
  if(kind==='grassland')return false
  if(kind!=='oasis')return true
  const basin=(p:{x:number;z:number})=>((p.x+24)/16)**2+((p.z-13)/22)**2 < ((p.x-24)/16)**2+((p.z+13)/22)**2
  return basin(a)===basin(b)
}
export function isWater(kind: TerrainKind, x: number, z: number): boolean {
  if (kind === 'lake') return (x / 29) ** 2 + (z / 35) ** 2 < 1
  if (kind === 'river') return Math.abs(x - riverCenter(z)) < 7 && !CROSSINGS.some(c => Math.abs(z - c) <= 5)
  if (kind === 'oasis') return ((x + 24) / 16) ** 2 + ((z - 13) / 22) ** 2 < 1 || ((x - 24) / 16) ** 2 + ((z + 13) / 22) ** 2 < 1
  return false
}
export function isCrossing(kind: TerrainKind, x: number, z: number): boolean {
  return kind === 'river' && CROSSINGS.some(c => Math.abs(z-c)<=5 && Math.abs(x-riverCenter(c))<17)
}

export function isSailable(kind: TerrainKind, x: number, z: number, radius = 0): boolean {
  const wet = (px: number,pz: number) => Math.abs(px) < 79.5 && Math.abs(pz) < 79.5 && (kind === 'river' ? Math.abs(px-riverCenter(pz)) < 7 : isWater(kind,px,pz))
  if (!wet(x,z)) return false
  for(let i=0;i<16;i++) if(!wet(x+Math.cos(i*Math.PI/8)*radius,z+Math.sin(i*Math.PI/8)*radius)) return false
  return true
}
export function nearestWater(kind: TerrainKind,x: number,z: number,radius=1.7,maxDistance=160): {x:number;z:number} | null {
  if(kind === 'grassland') return null
  if(isSailable(kind,x,z,radius))return {x,z}
  for(let r=0.5;r<=maxDistance;r+=0.5) for(let i=0;i<64;i++) {
    const p={x:x+Math.cos(i*Math.PI/32)*r,z:z+Math.sin(i*Math.PI/32)*r}
    if(isSailable(kind,p.x,p.z,radius))return p
  }
  return null
}
export function bridgeHeight(kind: TerrainKind,x:number,z:number):number {
  if(!isCrossing(kind,x,z))return 0
  const c=CROSSINGS.find(c=>Math.abs(z-c)<=5)!
  const d=Math.abs(x-riverCenter(c))
  return d<=8 ? 5 : Math.max(0,(17-d)/9*5)
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

export function drySegment(kind: TerrainKind, ax: number, az: number, bx: number, bz: number, radius = 1.7, water = false): boolean {
  const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.2))
  for (let i = 0; i <= steps; i++) if (!(water ? isSailable : isDry)(kind, ax + (bx - ax) * i / steps, az + (bz - az) * i / steps, radius)) return false
  return true
}

const CELL = 2
const N = 79
const coord = (i: number) => -78 + i * CELL
const index = (x: number, z: number) => Math.max(0, Math.min(N - 1, Math.round((z + 78) / CELL))) * N + Math.max(0, Math.min(N - 1, Math.round((x + 78) / CELL)))
const point = (i: number) => ({ x: coord(i % N), z: coord(Math.floor(i / N)) })
const masks = new Map<string, Uint8Array>()

/** A* on a conservative grid; diagonals cannot cut across shoreline corners. */
export function terrainRoute(kind: TerrainKind, ax: number, az: number, tx: number, tz: number, water=false, entryClearance=1.25): { x: number; z: number }[] {
  const goal = water ? nearestWater(kind,tx,tz,1.7) : nearestDry(kind, tx, tz, 1.7)
  if(!goal)return []
  const segment = (ax:number,az:number,bx:number,bz:number,radius=1.7)=>drySegment(kind,ax,az,bx,bz,radius,water)
  if (segment(ax, az, goal.x, goal.z)) return [goal]
  const key=`${kind}-${water}`
  let mask = masks.get(key)
  if (!mask) {
    mask = new Uint8Array(N * N)
    for (let i = 0; i < mask.length; i++) { const p = point(i); mask[i] = (water ? isSailable : isDry)(kind, p.x, p.z, 1.7) ? 1 : 0 }
    masks.set(key, mask)
  }
  // Beach landings can be narrower than the shared route grid. Connect them
  // using the moving unit's footprint, while keeping inland routes conservative.
  const validIndex = (x: number, z: number, clearance: number) => {
    let best = -1, distance = Infinity
    for (let i = 0; i < mask!.length; i++) if (mask![i]) {
      const p = point(i), d = (p.x - x) ** 2 + (p.z - z) ** 2
      if (d < distance && segment(x, z, p.x, p.z, clearance)) { best = i; distance = d }
    }
    return best
  }
  let start = index(ax, az), end = index(goal.x, goal.z)
  if (!mask[start] || !segment(ax, az, point(start).x, point(start).z, entryClearance)) start = validIndex(ax, az, entryClearance)
  if (!mask[end]) end = validIndex(goal.x, goal.z, 1.7)
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
