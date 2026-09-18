"use client";

import { CircleHelp, Play, X } from 'lucide-react'
import { MODERN_DOCTRINES } from '../game/modern'
import { CIV_DETAILS, GAME_TITLE } from '../game/constants'
import { useGameStore } from '../game/store'
import type { Civilization } from '../game/types'

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-200/90">{title}</h3>
      <ul className="mt-1.5 space-y-1 text-sm leading-relaxed text-amber-50/90">
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
          'Houses add +10 population; each Town Center adds 20 population capacity',
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
          'Each Town Center adds 20 population capacity',
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
          'Houses add +10 population; each Town Center adds 20 population capacity',
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

function MoreHelp({ title, children }: { title: string; children: React.ReactNode }) {
  return <details className="rounded-md border border-amber-800/60 bg-black/15 p-4">
    <summary className="cursor-pointer text-sm font-semibold text-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400">{title}</summary>
    <div className="mt-4 space-y-4">{children}</div>
  </details>
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
  const doctrine = MODERN_DOCTRINES[playerCiv]

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/65 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="game-help-title" className="relative flex max-h-[min(44rem,92vh)] w-full max-w-3xl flex-col overflow-hidden rounded-md border border-amber-700 bg-gradient-to-b from-[#3a2a18] to-[#1a120a] shadow-2xl">
        <button
          type="button"
          className="absolute right-3 top-3 z-10 rounded-sm p-1 text-amber-200/80 hover:bg-black/30 hover:text-amber-50"
          aria-label="Close help"
          onClick={() => useGameStore.getState().closeHelp()}
        >
          <X size={18} />
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-2 pt-6">
          <h2 id="game-help-title" className="pr-8 text-2xl font-bold text-amber-100">{GAME_TITLE} · How to play</h2>
          <p className="mt-1 text-sm text-amber-200/75">
            Destroy the <span className="font-semibold text-amber-100">{enemyDetails.name}</span> main starting Town Center to win. Protect your original Town Center; additional Town Centers do not replace it.
            The match stays paused until you press {playLabel}.
          </p>

          <div className="mt-5 space-y-5">
            <section className="rounded-md border border-amber-500/40 bg-amber-500/5 p-4" aria-labelledby="quick-start-heading">
              <h3 id="quick-start-heading" className="text-lg font-bold text-amber-100">Your first five steps</h3>
              <p className="mt-1 text-sm text-amber-200/80">First match? Choose Easy + Emerald Plains on the empire selection screen to learn on land.</p>
              <ol className="mt-4 space-y-4">
                {[
                  ['Put your villagers to work', 'Left-click a villager, then right-click a tree for Wood, a berry bush or herd for Food, or a gold mine for Gold. Villagers gather and deliver supplies automatically. Split workers between resources.'],
                  ['Grow your economy', 'Left-click your Town Center. Its buttons appear along the bottom: choose Train Villager (100 Wood). Select each new worker and send them to a resource. The top bar shows your supplies and population.'],
                  ['Build room for more people', 'Select a villager, choose House (Manor for Britain) in the bottom bar, then left-click a clear, valid spot on land. The worker walks over and builds it. Population capacity rises when it finishes. Escape cancels placement.'],
                  ['Advance and recruit', 'Save 800 Food. Select a Town Center and choose Advance to Commerce. When the upgrade finishes, select a worker and build a Barracks. Select the completed Barracks and use its training buttons to recruit soldiers. Keep gathering while you train.'],
                  ['Defend, then attack', 'Drag a box around your soldiers. Right-click an enemy to attack that target. To fight along a route, press F (or Attack-move), then left-click the destination. Keep defenders near your main Town Center and bring your army to destroy the enemy’s main Town Center.'],
                ].map(([title, text], i) => <li key={title} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-sm font-bold text-amber-200">{i + 1}</span><div><h4 className="text-sm font-bold text-amber-50">{title}</h4><p className="mt-1 text-sm leading-relaxed text-amber-100/80">{text}</p></div></li>)}
              </ol>
            </section>
            <Section title="Remember these three things" items={[
              'Select first, give the order second. The bottom command bar changes to match the worker, soldier or building you selected.',
              'Only the original main Town Center decides victory or defeat. Extra Town Centers do not act as extra lives. Select a Town Center and look for the Main Town Center label.',
              'Help pauses the match. Reopen Help / Controls any time you need this guide.',
            ]} />
            <MoreHelp title="Mouse & keyboard reference">
              <Section title="Select and give orders" items={[
                'Left-click a friendly unit or building to select it. Drag on the ground to box-select units. Shift-click adds or removes a unit from your selection.',
                'With units selected: right-click open ground to move, a resource to gather with workers, or an enemy unit/building to attack.',
                'Attack-move: select soldiers → press F or click Attack-move → left-click ground. They engage enemies along the route.',
                'Select a production building, then right-click the ground to set where newly trained units gather (its rally point).',
                'Box and Line buttons change the formation of selected troops.',
              ]} />
              <Section title="Camera and shortcuts" items={[
                'WASD or arrow keys move the camera. Scroll the mouse wheel to zoom. Hold the middle mouse button and drag to pan.',
                'Press . (period), or click Idle villager, to select a worker without a task. Right-click a resource to put them back to work.',
                'Ctrl+1–9 (Cmd+1–9 on Mac) saves selected troops as a group. Press that number alone to select the group again.',
                'Escape cancels attack-move, building placement or selection. While Help is open, Escape or Enter closes it and resumes play.',
              ]} />
            </MoreHelp>
            <MoreHelp title="Economy, construction & common questions">
              <Section title="Keep your base working" items={[
                'Workers automatically return gathered supplies to a suitable drop-off. Build a Lumber Camp near trees, a Mill near food, or a Mining Camp near mines to reduce travel. Town Centers also accept resources.',
                'Farms generate Food passively once built. Add them before nearby food runs out.',
                'Cannot train? Check the displayed resource cost and POP at the top. If population is full, finish more houses or your civilization’s population buildings.',
                'Cannot build? Keep a villager selected, check resources and the required age, and choose open land away from water, buildings and resource deposits. A Dock needs a shoreline.',
                'Missing a command? Select the building that produces the unit, or select a worker for construction. Some choices unlock only after advancing an age.',
                'Medium and Hard bring earlier attacks and faster enemy age advancement. Build defenders before sending your entire army away.',
              ]} />
              <Section title={economy.title} items={economy.items} />
            </MoreHelp>
            <MoreHelp title="Your civilization & advancing through the ages">
              <Section title="Age-up checklist" items={[
                'Select a completed Town Center to advance. Have the displayed resources available, click the age-up button, then wait for the upgrade to finish.',
                'Discovery → Commerce: 800 Food. Commerce → Fortress: 1200 Food + 1000 Gold.',
                'Fortress → Industrial: 2000 Food + 1200 Gold, 60 seconds. Industrial improves your army, buildings and workers and unlocks Industrial Workshops.',
                'Industrial → Modern: 3000 Food + 2200 Gold, 80 seconds. Modern unlocks drilling resources, vehicles and aircraft.',
                'Age up while keeping workers gathering and enough troops at home to defend your main Town Center.',
              ]} />
              <Section title={military.title} items={military.items} />
            </MoreHelp>
            <MoreHelp title="Water maps: fish, ships & moving troops overseas">
              <Section title="Food and fleets" items={[
                'Great Lake, Two Crossings and Sundering Sea support ships. Emerald Plains is a land map. Sundering Sea has no land crossing: use transport ships or helicopters to reach the enemy.',
                'Select a worker and right-click marked Shore Fish to gather from land. For deeper fish, build a Dock, select it and train a Fishing Boat. Right-click fish with the boat selected; it returns food to a Dock.',
                'Place Docks on dry land within 6 tiles of navigable water. Fishing Boats are available from the start; Transport Ships unlock in Commerce and cannon ships in Fortress.',
                'Ships move within connected water. Land troops can cross the river at its two bridges; ships can pass beneath them.',
              ]} />
              <Section title="Transport troops in four steps" items={[
                '1. Select a Transport Ship and move it close to the shore where your troops are waiting.',
                '2. Select your land troops, then right-click that transport to board. Passengers still use population capacity.',
                '3. Select the transport and right-click water near a clear beach on the destination shore.',
                '4. When the ship arrives, click Unload troops in the bottom bar. Select the landed troops and give them a move or attack order. If unloading fails, try a clearer stretch of shore. Passengers are lost if the ship sinks.',
                'Transports automatically become steamships in Industrial and modern landing ships in Modern, gaining capacity and improved stats.',
              ]} />
            </MoreHelp>
            <MoreHelp title="Modern Age: resources, army & civilization strengths">
              <Section title="Build a modern army" items={[
                'Select workers and right-click Petrol or Metal deposits to drill. They deliver to a Mining Camp or Town Center. Keep gathering Food, Gold and Wood as well.',
                'Barracks train Riflemen, Machine Gunners and Rocket Troopers. Build a Factory for Tanks, Recon Jeeps and Heavy Artillery, a Helipad for Attack Helicopters, and a Dock for Destroyers.',
                'Mix your army: Machine Gunners counter infantry; Rocket Troopers counter tanks and helicopters. Protect long-range Heavy Artillery with other troops.',
                'Helicopters fly across land and water. Riflemen, Machine Gunners, Rocket Troopers, Jeeps and Destroyers can defend against aircraft.',
              ]} />
              <Section title={`${CIV_DETAILS[playerCiv].name} · ${doctrine.title}`} items={[doctrine.strengths, doctrine.weakness]} />
              <Section title={`Your opponent: ${enemyDetails.name}`} items={[MODERN_DOCTRINES[enemyCiv].strengths, MODERN_DOCTRINES[enemyCiv].weakness]} />
            </MoreHelp>
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
