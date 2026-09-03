"use client";

import { CircleHelp, Play, X } from 'lucide-react'
import { CIV_DETAILS, GAME_TITLE } from '../game/constants'
import { useGameStore } from '../game/store'
import type { Civilization } from '../game/types'

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-200/90">{title}</h3>
      <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-amber-50/90">
        {items.map((item) => (
          <li key={item} className="pl-3" style={{ textIndent: '-0.65rem' }}>
            <span className="mr-1.5 text-amber-400/80">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function getCivEconomyItems(civ: Civilization): { title: string; items: string[] } {
  switch (civ) {
    case 'indian':
      return {
        title: 'Indian Economy 🇮🇳',
        items: [
          'Villagers cost 100 Wood and gather wood, berries, hunted herds, and gold mines',
          'Sacred Fields generate continuous passive Food without exhausting resource nodes',
          'Universal Farms (70 Wood, 40 Food) provide additional steady food cultivation',
          'Drop off at Town Center, or localized Lumber Camps, Mills, and Mining Camps',
          'Houses add +10 population; Town Center starts at 20 pop with 100 maximum cap',
          'Aging: Discovery → Commerce costs 800 Food; Commerce → Fortress costs 1200 Food, 1000 Gold',
        ],
      }
    case 'british':
      return {
        title: 'British Economy 🇬🇧',
        items: [
          'Villagers cost 100 Wood and gather wood, berries, hunted herds, and gold mines',
          'Manors provide +15 population and automatically spawn a free Settler upon completion',
          'Universal Farms (70 Wood, 40 Food) provide steady passive food cultivation',
          'Drop off at Town Center, or localized Lumber Camps, Mills, and Mining Camps',
          'Town Center starts at 20 pop with 100 maximum population cap',
          'Aging: Discovery → Commerce costs 800 Food; Commerce → Fortress costs 1200 Food, 1000 Gold',
        ],
      }
    case 'japanese':
      return {
        title: 'Japanese Economy 🇯🇵',
        items: [
          'Villagers cost 100 Wood and gather wood, berries, hunted herds, and gold mines',
          'Torii Shrines provide +10 population and generate continuous passive Gold tribute',
          'Universal Farms (70 Wood, 40 Food) provide steady passive food cultivation',
          'Bushido Discipline: All melee infantry fight with +25% attack speed',
          'Drop off at Town Center, or localized Lumber Camps, Mills, and Mining Camps',
          'Aging: Discovery → Commerce costs 800 Food; Commerce → Fortress costs 1200 Food, 1000 Gold',
        ],
      }
    case 'french':
      return {
        title: 'French Economy 🇫🇷',
        items: [
          'Coureur Settlers gather all resources 25% faster with extra carry capacity (18 units)',
          'Châteaux provide +10 population, fire defensive arrows, and yield continuous Gold tribute (+2.0/s)',
          'Universal Farms (70 Wood, 40 Food) provide steady passive food cultivation',
          'Drop off at Town Center, or localized Lumber Camps, Mills, and Mining Camps',
          'Houses add +10 population; Town Center starts at 20 pop with 100 maximum cap',
          'Aging: Discovery → Commerce costs 800 Food; Commerce → Fortress costs 1200 Food, 1000 Gold',
        ],
      }
  }
}

function getCivMilitaryItems(civ: Civilization): { title: string; items: string[] } {
  switch (civ) {
    case 'indian':
      return {
        title: 'Indian Military & Ages 🇮🇳',
        items: [
          'Commerce Age: Unlocks Barracks (Sepoy musket lines, Rajput swords) & Caravanserai (Sowar camel cavalry)',
          'Fortress Age: Unlocks Gurkha riflemen, heavy Mahout Lancers, colossal Siege Elephants, and Agra Fort',
          'Mahout Lancers & Siege Elephants soak immense damage and trample through enemy infantry lines',
          'Agra Fort defends territory with continuous automated arrow volleys',
          'Artillery Foundry: Construct Falconet field cannons to crush enemy buildings and towers',
        ],
      }
    case 'british':
      return {
        title: 'British Military & Ages 🇬🇧',
        items: [
          'Commerce Age: Unlocks Barracks (Pikeman, long-range Longbowman) & Caravanserai (Hussar cavalry)',
          'Fortress Age: Unlocks elite Redcoat line musketeers, Dragoon cavalry, and Falconet artillery',
          'Longbowmen out-range standard archers; Redcoats deliver crushing coordinated musket volleys',
          'Hussars counter ranged units; Pikemen counter cavalry charges; Dragoons skirmish on horseback',
          'Artillery Foundry: Build heavy Falconet cannons to shatter enemy castles and forts',
        ],
      }
    case 'japanese':
      return {
        title: 'Japanese Military & Ages 🇯🇵',
        items: [
          'Commerce Age: Unlocks Barracks (Ashigaru spearmen, Yumi Archers) & Caravanserai (Naginata cavalry)',
          'Fortress Age: Unlocks master dual-blade Samurai, Tenshu Pagoda Castle, and Artillery Foundry',
          'Bushido mastery: Samurai excel in lethal close-quarters combat; Naginatas swiftly flank lines',
          'Tenshu Pagoda Castle auto-fires defensive arrows and anchors your defensive stronghold',
          'Artillery Foundry: Build Falconet field cannons to demolish enemy fortifications',
        ],
      }
    case 'french':
      return {
        title: 'French Military & Ages 🇫🇷',
        items: [
          'Commerce Age: Unlocks Barracks (Crossbowman piercing bolts, Halberdier polearms) & Stables (Hussar)',
          'Fortress Age: Unlocks elite armored Cuirassiers (heavy shock cavalry) and Falconet field artillery',
          'Halberdiers deal 1.65× bonus damage against enemy cavalry charges',
          'Cuirassiers possess gilded armor, splash damage, and a +20% French royal cavalry shock charge bonus',
          'Artillery Foundry: Field Falconet cannons to bombard distant enemy buildings and castles',
        ],
      }
  }
}

function getCivEnemyItems(civ: Civilization): { title: string; items: string[] } {
  switch (civ) {
    case 'indian':
      return {
        title: 'Indian Enemy Opponent 🇮🇳',
        items: [
          'Enemy base fortified at top-right corner; starts with Town Center, Sacred Fields, and guards',
          'Defensive Fortress: Agra Fort auto-fires rapid defensive arrow volleys at invaders',
          'Raid Wave 1 (~10:00): Sepoy musket lines and Rajput swordsmen',
          'Raid Wave 2 (~18:00): Gurkha riflemen, Sowar camel riders, and Mahout Lancers',
          'Raid Wave 3 (~26:00): Colossal Siege Elephants, Mahouts, Gurkhas, and Falconet cannons',
          'Tactics: Use anti-cavalry pikes and halberdiers to counter heavy elephant trample rushes!',
        ],
      }
    case 'british':
      return {
        title: 'British Enemy Opponent 🇬🇧',
        items: [
          'Enemy base fortified at top-right corner; starts with red-brick Town Center, Manors, and guards',
          'Manors continuously spawn free enemy settlers to rapidly expand the British war machine',
          'Raid Wave 1 (~10:00): Longbowmen, Pikemen, and Redcoat line musketeers',
          'Raid Wave 2 (~18:00): Redcoat line infantry and Hussar shock cavalry',
          'Raid Wave 3 (~26:00): Redcoats, Dragoon ranged riders, and heavy Falconet artillery',
          'Tactics: Longbowmen have extended range; use fast cavalry to rush and flank them!',
        ],
      }
    case 'japanese':
      return {
        title: 'Japanese Enemy Opponent 🇯🇵',
        items: [
          'Enemy base fortified at top-right corner; starts with Town Center, Torii Shrines, and guards',
          'Defensive Stronghold: Tenshu Pagoda Castle unleashes lethal arrow fire on all intruders',
          'Bushido discipline grants all Japanese enemy melee troops +25% attack speed',
          'Raid Wave 1 (~10:00): Ashigaru spearmen and Yumi Archers',
          'Raid Wave 2 (~18:00): Dual-blade Samurai and Naginata shock cavalry',
          'Raid Wave 3 (~26:00): Elite Samurai masters, Naginata riders, and Falconet siege cannons',
          'Tactics: Avoid tight melee grouping; soften Samurai from range before engaging!',
        ],
      }
    case 'french':
      return {
        title: 'French Enemy Opponent 🇫🇷',
        items: [
          'Enemy base fortified at top-right corner; starts with Town Center, stone Châteaux, and guards',
          'Châteaux fire defensive arrow volleys and generate continuous Gold tribute for enemy reinforcements',
          'Raid Wave 1 (~10:00): Crossbowmen and Halberdier polearms',
          'Raid Wave 2 (~18:00): Halberdiers, Crossbowmen, and Hussar cavalry',
          'Raid Wave 3 (~26:00): Devastating armored Cuirassiers, Halberdiers, and Falconet artillery',
          'Tactics: Cuirassiers deal area splash damage; counter with anti-cavalry pikes and spaced ranks!',
        ],
      }
  }
}

export function HelpOverlay() {
  const helpOpen = useGameStore((s) => s.helpOpen)
  const gameTime = useGameStore((s) => s.gameTime)
  const playerCiv = useGameStore((s) => s.playerCiv)
  const enemyCiv = useGameStore((s) => s.enemyCiv)

  if (!helpOpen) return null

  const started = gameTime > 0.05
  const playLabel = started ? 'Resume' : 'Play'

  const enemyDetails = CIV_DETAILS[enemyCiv] ?? CIV_DETAILS.british

  const economy = getCivEconomyItems(playerCiv)
  const military = getCivMilitaryItems(playerCiv)
  const enemy = getCivEnemyItems(enemyCiv)

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/65 p-4">
      <div className="relative flex max-h-[min(44rem,92vh)] w-full max-w-3xl flex-col overflow-hidden rounded-md border border-amber-700 bg-gradient-to-b from-[#3a2a18] to-[#1a120a] shadow-2xl">
        <button
          type="button"
          className="absolute right-3 top-3 z-10 rounded-sm p-1 text-amber-200/80 hover:bg-black/30 hover:text-amber-50"
          aria-label="Close help"
          onClick={() => useGameStore.getState().closeHelp()}
        >
          <X size={18} />
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-2 pt-6">
          <div className="pr-8 text-2xl font-bold text-amber-100">{GAME_TITLE}</div>
          <p className="mt-1 text-sm text-amber-200/75">
            Destroy the <span className="font-semibold text-amber-100">{enemyDetails.name}</span> Town Center to win.
            The match stays paused until you press {playLabel}.
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Section
              title="Controls"
              items={[
                'Left-click to select a unit or building; Shift-click to add/remove',
                'Drag a box to select multiple units quickly',
                'Right-click (or left-click an enemy) to move, gather, or attack',
                'F or Attack-move: soldiers fight any enemies along their path',
                'Box or Line formation on the command bar for tactical troop spreads',
                '. (period) selects the next idle villager',
                'Ctrl+1–9 saves a control group; 1–9 recalls it',
                'WASD or arrow keys pan; mouse wheel zooms; middle-drag pans',
                'Escape cancels placement, attack-move, or selection',
              ]}
            />
            <Section title={economy.title} items={economy.items} />
            <Section title={military.title} items={military.items} />
            <Section title={enemy.title} items={enemy.items} />
          </div>
        </div>

        <div className="flex shrink-0 justify-center border-t border-amber-800/50 bg-[#1a120a] px-7 py-4">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-sm border border-amber-500 bg-[#2a1d10] px-8 py-2.5 text-sm font-semibold text-amber-50 hover:bg-[#3b2a16]"
            onClick={() => useGameStore.getState().closeHelp()}
          >
            <Play size={16} fill="currentColor" />
            {playLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function HelpButton() {
  const helpOpen = useGameStore((s) => s.helpOpen)
  const winner = useGameStore((s) => s.winner)
  if (helpOpen || winner) return null

  return (
    <button
      type="button"
      className="pointer-events-auto absolute bottom-28 right-4 z-20 inline-flex items-center gap-2 rounded-sm border border-amber-700/70 bg-[#2c1e10]/95 px-3 py-2 text-xs text-amber-50 shadow-xl hover:bg-[#3b2a16]"
      onClick={() => useGameStore.getState().openHelp()}
    >
      <CircleHelp size={16} />
      Help / Controls
    </button>
  )
}
