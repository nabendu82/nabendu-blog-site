import type { Civilization, Entity } from './types'

export const NAVIES: Record<Civilization, { fishingBoat: string; transportShip: string; warship: string; color: string; sail: string; capacity: number; description: string }> = {
  indian: { fishingBoat: 'Machhua Fishing Boat', transportShip: 'Dhow Transport', warship: 'Ghurab Cannon Ship', color: '#764f30', sail: '#ecd3a0', capacity: 10, description: 'Lateen sails and carved prows. Fishing boats gather 15% faster.' },
  british: { fishingBoat: 'Fishing Cutter', transportShip: 'Royal Transport', warship: 'Royal Frigate', color: '#493c32', sail: '#efe6d1', capacity: 10, description: 'Square-rigged Royal Navy vessels. Frigates gain +2 cannon range.' },
  japanese: { fishingBoat: 'Kobaya Fishing Boat', transportShip: 'Bune Transport', warship: 'Atakebune Cannon Ship', color: '#543c30', sail: '#e5d4b2', capacity: 10, description: 'Battened sails and armored deckhouses. Ships gain 15% health.' },
  french: { fishingBoat: 'Fishing Chaloupe', transportShip: 'Flûte Transport', warship: 'French Frigate', color: '#65503a', sail: '#e8dfca', capacity: 12, description: 'Gilded sterns and blue trim. Transports carry 12 troops; all ships sail 10% faster.' },
}

export function applyNavalCivilization(e: Entity,civ:Civilization):void {
  if(civ==='japanese'){e.maxHp=Math.round(e.maxHp*1.15);e.hp=e.maxHp}
  if(civ==='french')e.speed*=1.1
  if(civ==='british' && e.kind==='warship')e.attackRange+=2
}

export function transportCapacity(civ: Civilization, age: number): number {
  return NAVIES[civ].capacity + (age >= 4 ? 10 : age >= 3 ? 4 : 0)
}
/** Promote existing and newly trained transports without healing damage or dropping cargo. */
export function upgradeTransport(e: Entity, age: number): void {
  if(e.kind!=='transportShip' || e.dying)return
  const previous=e.transportAge ?? 0
  for(const stage of [3,4])if(age>=stage && previous<stage){
    const ratio=e.hp/e.maxHp
    e.maxHp=Math.round(e.maxHp*(stage===3?1.2:1.5));e.hp=e.maxHp*ratio
    e.speed*=stage===3?1.15:1.25
  }
  e.transportAge=Math.max(previous,age)
}

export function navalName(civ: Civilization, kind: 'fishingBoat'|'transportShip'|'warship', age: number): string {
  if(kind==='transportShip' && age>=4)return `${civ==='french'?'Marine':civ==='british'?'Royal':civ==='japanese'?'Bune':'Dhow'} Landing Ship`
  if(kind==='transportShip' && age>=3)return 'Steam Transport'
  return NAVIES[civ][kind]
}
