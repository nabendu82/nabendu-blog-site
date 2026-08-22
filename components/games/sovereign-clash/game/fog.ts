import { FOG_RES, MAP_HALF, MAP_SIZE, visionRange } from './constants'
import { isBuilding, isComplete, isUnit, type Entity } from './types'

export const fogExplored = new Uint8Array(FOG_RES * FOG_RES)
export const fogVisible = new Uint8Array(FOG_RES * FOG_RES)

function cell(x: number, z: number): number {
  const cx = Math.floor(((x + MAP_HALF) / MAP_SIZE) * FOG_RES)
  const cz = Math.floor(((z + MAP_HALF) / MAP_SIZE) * FOG_RES)
  const ix = Math.max(0, Math.min(FOG_RES - 1, cx))
  const iz = Math.max(0, Math.min(FOG_RES - 1, cz))
  return iz * FOG_RES + ix
}

export function resetFog(): void {
  fogExplored.fill(0)
  fogVisible.fill(0)
}

export function tickFog(entities: Entity[]): void {
  fogVisible.fill(0)
  for (const e of entities) {
    if (e.dying || e.team !== 'player') continue
    if (e.kind === 'projectile') continue
    if (isBuilding(e) && !isComplete(e)) continue
    if (!isUnit(e) && !isBuilding(e)) continue
    const range = visionRange(e.kind, isBuilding(e))
    const r2 = range * range
    const minX = e.x - range
    const maxX = e.x + range
    const minZ = e.z - range
    const maxZ = e.z + range
    const x0 = Math.floor(((minX + MAP_HALF) / MAP_SIZE) * FOG_RES)
    const x1 = Math.floor(((maxX + MAP_HALF) / MAP_SIZE) * FOG_RES)
    const z0 = Math.floor(((minZ + MAP_HALF) / MAP_SIZE) * FOG_RES)
    const z1 = Math.floor(((maxZ + MAP_HALF) / MAP_SIZE) * FOG_RES)
    for (let iz = z0; iz <= z1; iz += 1) {
      if (iz < 0 || iz >= FOG_RES) continue
      for (let ix = x0; ix <= x1; ix += 1) {
        if (ix < 0 || ix >= FOG_RES) continue
        const wx = ((ix + 0.5) / FOG_RES) * MAP_SIZE - MAP_HALF
        const wz = ((iz + 0.5) / FOG_RES) * MAP_SIZE - MAP_HALF
        const dx = wx - e.x
        const dz = wz - e.z
        if (dx * dx + dz * dz <= r2) {
          const i = iz * FOG_RES + ix
          fogVisible[i] = 1
          fogExplored[i] = 1
        }
      }
    }
  }
}

export function fogState(x: number, z: number): 0 | 1 | 2 {
  const i = cell(x, z)
  if (fogVisible[i]) return 2
  if (fogExplored[i]) return 1
  return 0
}

export function isInVision(x: number, z: number): boolean {
  return fogVisible[cell(x, z)] === 1
}

export function isExplored(x: number, z: number): boolean {
  return fogExplored[cell(x, z)] === 1
}
