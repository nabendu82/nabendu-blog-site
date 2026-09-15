import { DISPLAY_NAMES, MODERN_TRAINING } from './constants'
import { isModernUnit, type Age, type BuildingKind, type Civilization, type Entity, type UnitKind } from './types'

type Modifier = { hp?: number; attack?: number; speed?: number; range?: number; reload?: number }
export const MODERN_DOCTRINES: Record<Civilization, { title: string; strengths: string; weakness: string; modifiers: Partial<Record<UnitKind, Modifier>>; names: Partial<Record<UnitKind, string>> }> = {
  indian: {
    title: 'Rocket Artillery Command',
    strengths: 'Exclusive Pinaka Rocket Launcher: six-rocket area salvo, 23 range and a mobile wheeled chassis.',
    weakness: 'Pinaka reloads for 6 seconds and cannot target aircraft. Helicopters have 15% less health.',
    modifiers: { helicopter: { hp: .85 } }, names: { pinaka: 'Pinaka Rocket Launcher' },
  },
  british: {
    title: 'Fleet Air Defence',
    strengths: 'Daring Destroyers gain 25% health, +3 range and 50% damage against helicopters.',
    weakness: 'Heavy Artillery moves 20% slower. The main advantage requires a water map.',
    modifiers: { destroyer: { hp: 1.25, range: 3 }, heavyArtillery: { speed: .8 } }, names: { destroyer: 'Daring Destroyer' },
  },
  japanese: {
    title: 'Mobile Armor Doctrine',
    strengths: 'Type 10 Mobile Tanks move 25% faster and reload 15% sooner. Recon Jeeps move 20% faster.',
    weakness: 'Mobile Tanks have 15% less health: flank and reposition rather than trade shots.',
    modifiers: { tank: { speed: 1.25, reload: .85, hp: .85 }, jeep: { speed: 1.2 } }, names: { tank: 'Type 10 Mobile Tank' },
  },
  french: {
    title: 'Tiger Air Assault',
    strengths: 'Tiger Attack Helicopters gain 25% attack and 15% speed, including flight over water.',
    weakness: 'Tanks have 15% less health. Enemy rocket troops and destroyers still counter helicopters.',
    modifiers: { helicopter: { attack: 1.25, speed: 1.15 }, tank: { hp: .85 } }, names: { helicopter: 'Tiger Attack Helicopter' },
  },
}

export function modernTraining(building: BuildingKind, civ: Civilization): UnitKind[] {
  const common = MODERN_TRAINING[building] ?? []
  return building === 'factory' && civ === 'indian' ? [...common, 'pinaka'] : common
}
export function modernName(kind: string, civ: Civilization): string {
  return MODERN_DOCTRINES[civ].names[kind as UnitKind] ?? DISPLAY_NAMES[kind] ?? kind
}
/** Per-entity marker keeps old armies, new training and unloaded passengers consistent. */
export function applyModernDoctrine(e: Entity, civ: Civilization, age: Age): void {
  if (age < 4 || e.modernDoctrine || e.dying || !isModernUnit(e)) return
  const modifier = MODERN_DOCTRINES[civ].modifiers[e.kind as UnitKind]
  if (modifier) {
    const ratio = e.hp / e.maxHp
    e.maxHp = Math.round(e.maxHp * (modifier.hp ?? 1))
    e.hp = e.maxHp * ratio
    e.attack = Math.round(e.attack * (modifier.attack ?? 1))
    e.speed *= modifier.speed ?? 1
    e.attackRange += modifier.range ?? 0
  }
  e.modernDoctrine = civ
}
export function modernReload(e: Entity, civ: Civilization, age: Age): number {
  return age >= 4 ? MODERN_DOCTRINES[civ].modifiers[e.kind as UnitKind]?.reload ?? 1 : 1
}
