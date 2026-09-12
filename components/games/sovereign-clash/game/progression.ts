import { INDUSTRIAL_CIVS } from './constants'
import { isBuilding, isUnit, requiredAge, type Age, type Civilization, type Entity } from './types'

/** Preserve damage and construction progress; apply each promotion exactly once. */
export function applyIndustrialUpgrade(e: Entity, civ: Civilization, age: Age): void {
  if (age < 3 || e.industrialUpgraded || e.dying || (!isUnit(e) && !isBuilding(e))) return
  e.industrialUpgraded = true
  if (requiredAge(e.kind) >= 3) return
  const multiplier = isBuilding(e) ? 1.35 : e.kind === 'villager' ? 1.15
    : isUnit(e) && INDUSTRIAL_CIVS[civ].guards.includes(e.kind) ? 1.4 : 1.25
  const health = e.hp / e.maxHp
  e.maxHp = Math.round(e.maxHp * multiplier)
  e.hp = e.maxHp * health
  e.attack = Math.round(e.attack * multiplier)
}
