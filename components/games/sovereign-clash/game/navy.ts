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
