import type { Entity } from './types'

const CELL=8
const indexes=new WeakMap<Entity[],Map<string,Entity[]>>()
let frame:Entity[]|null=null
export function prepareSpatial(entities:Entity[]):void {frame=entities;indexes.delete(entities)}
/** Reused within each simulation step; avoids scanning the world for every unit. */
export function nearby(entities:Entity[],x:number,z:number,radius:number):Entity[] {
  if(frame!==entities)return entities
  let grid=indexes.get(entities)
  if(!grid) {
    grid=new Map()
    for(const e of entities) {
      if(e.dying || e.kind==='projectile')continue
      const key=`${Math.floor(e.x/CELL)},${Math.floor(e.z/CELL)}`
      const bucket=grid.get(key)
      if(bucket)bucket.push(e);else grid.set(key,[e])
    }
    indexes.set(entities,grid)
  }
  const result:Entity[]=[]
  // Extra margin covers movement within the current step.
  radius+=1
  for(let ix=Math.floor((x-radius)/CELL);ix<=Math.floor((x+radius)/CELL);ix++)for(let iz=Math.floor((z-radius)/CELL);iz<=Math.floor((z+radius)/CELL);iz++) {
    const bucket=grid.get(`${ix},${iz}`)
    if(bucket)result.push(...bucket)
  }
  return result
}
