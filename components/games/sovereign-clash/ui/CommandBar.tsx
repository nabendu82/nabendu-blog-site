"use client";

import { useEffect, useState, type ReactNode } from 'react'
import {
  Castle,
  Crown,
  Fence,
  House,
  LayoutGrid,
  PersonStanding,
  Pickaxe,
  Spline,
  Sprout,
  Swords,
  Target,
  Tent,
  TowerControl,
  Trees,
  Wheat,
  Zap,
} from 'lucide-react'
import { COSTS, DISPLAY_NAMES, AGE_NAMES, AGE_ADVANCEMENTS, INDUSTRIAL_CIVS, MODERN_TRAINING } from '../game/constants'
import { NAVIES } from '../game/navy'
import { canAfford, useGameStore } from '../game/store'
import { isBuilding, isMilitary, isUnit, requiredAge, type Entity, type BuildingKind, type PlacementKind } from '../game/types'

function ActionButton({
  disabled,
  onClick,
  children,
}: {
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="min-w-[8.6rem] rounded-sm border border-amber-700/70 bg-[#2a1d10] px-2.5 py-1.5 text-left text-xs text-amber-50 shadow-md transition hover:bg-[#3b2a16] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}

function costText(cost: { wood?: number; food?: number; gold?: number; petrol?: number; metal?: number }): string {
  const parts: string[] = []
  if (cost.wood) parts.push(`${cost.wood} Wood`)
  if (cost.food) parts.push(`${cost.food} Food`)
  if (cost.gold) parts.push(`${cost.gold} Gold`)
  if(cost.petrol) parts.push(`${cost.petrol} Petrol`)
  if(cost.metal) parts.push(`${cost.metal} Metal`)
  return parts.join(' · ')
}

function BuildBtn({
  kind,
  label,
  icon,
  wood,
  food,
  gold,
  placementKind,
  locked,
}: {
  kind: NonNullable<PlacementKind>
  label: string
  icon: ReactNode
  wood: number
  food: number
  gold: number
  placementKind: PlacementKind
  locked?: boolean
}) {
  const petrol = useGameStore(s=>s.petrol)
  const metal = useGameStore(s=>s.metal)
  const factoryCount = useGameStore(s => kind === 'factory' ? Object.values(s.entities).filter(e => e.kind === 'factory' && e.team === 'player' && !e.dying).length : 0)
  return (
    <ActionButton
      disabled={!!locked || factoryCount >= 2 || !canAfford(COSTS[kind], wood, food, gold, petrol, metal)}
      onClick={() => useGameStore.getState().setPlacement(kind)}
    >
      {icon} {label}
      <div className="text-[10px] text-amber-200/70">
        {locked ? `Requires ${AGE_NAMES[requiredAge(kind)]}` : factoryCount >= 2 ? 'Workshop limit reached (2)' : costText(COSTS[kind])}
      </div>
      {placementKind === kind && <div className="text-[10px] text-emerald-300">Click map to place</div>}
    </ActionButton>
  )
}

export function CommandBar() {
  const terrain=useGameStore(s=>s.terrain)
  const selectedId = useGameStore((s) => s.selectedId)
  const selectedIds = useGameStore((s) => s.selectedIds)
  const wood = useGameStore((s) => s.wood)
  const food = useGameStore((s) => s.food)
  const gold = useGameStore((s) => s.gold)
  const pop = useGameStore((s) => s.pop)
  const popCap = useGameStore((s) => s.popCap)
  const placementKind = useGameStore((s) => s.placementKind)
  const commandMode = useGameStore((s) => s.commandMode)
  const petrol = useGameStore(s=>s.petrol)
  const metal = useGameStore(s=>s.metal)
  const playerAge = useGameStore((s) => s.playerAge)
  const playerCiv = useGameStore((s) => s.playerCiv)
  const aging = useGameStore((s) => s.aging)
  const ageTimer = useGameStore((s) => s.ageTimer)
  const formation = useGameStore((s) => s.formation)
  const [live, setLive] = useState<Entity[]>([])

  useEffect(() => {
    let raf = 0
    let last = 0
    const loop = (t: number) => {
      if (t - last > 100) {
        last = t
        const s = useGameStore.getState()
        setLive(
          s.selectedIds.map((id) => s.entities[id]).filter((e): e is Entity => !!e && !e.dying),
        )
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [selectedId, selectedIds])

  const e = live[0] ?? null
  const count = live.length
  const hasVillager = live.some((u) => u.kind === 'villager' && u.team === 'player')
  const hasArmy = live.some((u) => u.team === 'player' && (isMilitary(u) || u.kind === 'villager'))
  const canRally = live.some(
    (u) =>
      u.team === 'player' &&
      (u.kind === 'townCenter' ||
        u.kind === 'barracks' ||
        u.kind === 'caravanserai' ||
        u.kind === 'helipad' || u.kind === 'foundry' || u.kind === 'factory' || u.kind==='dock') &&
      u.buildProgress >= 1,
  )

  const title =
    count === 0
      ? null
      : count === 1
        ? (e!.kind === 'fishingBoat'||e!.kind === 'transportShip'||e!.kind === 'warship' ? NAVIES[e!.team==='enemy'?useGameStore.getState().enemyCiv:playerCiv][e!.kind] : e!.kind==='fish' ? e!.shoreFish?'Shore Fish':'Deep-water Fish' : e!.kind === 'factory' ? (playerAge >= 4 ? 'Vehicle Factory' : INDUSTRIAL_CIVS[e!.team === 'enemy' ? useGameStore.getState().enemyCiv : playerCiv].workshop) : DISPLAY_NAMES[e!.kind] ?? e!.kind)
        : `${count} selected`

  return (
    <div className="pointer-events-auto flex max-h-[38vh] w-full max-w-6xl items-stretch gap-3 overflow-y-auto rounded-t-md border-x border-t border-amber-700/60 bg-gradient-to-b from-[#2c1e10] to-[#1a120a] px-3 py-3 shadow-2xl sm:gap-4 sm:px-4">
      <div className="w-28 shrink-0 border-r border-amber-800/50 pr-3 sm:w-56 sm:pr-4">
        {e ? (
          <>
            <div className="text-sm font-semibold tracking-wide text-amber-100">{title}</div>
            <div className="mt-1 text-xs text-amber-200/80">
              {e.team === 'player' ? 'Your forces' : e.team === 'enemy' ? 'Enemy' : 'Resource'}
            </div>
            {e.maxHp > 1 && count === 1 && (
              <div className="mt-2 text-xs tabular-nums text-amber-50">
                HP {Math.max(0, Math.ceil(e.hp))} / {e.maxHp}
              </div>
            )}
            {isUnit(e) && count === 1 && (
              <div className="mt-1 text-xs text-amber-100/90">Attack {e.attack}</div>
            )}
            {isBuilding(e) && e.buildProgress < 1 && (
              <div className="mt-1 text-xs text-amber-200">
                Building {Math.round(e.buildProgress * 100)}%
              </div>
            )}
            {e.trainQueue.length > 0 && (
              <div className="mt-1 text-xs text-amber-200">
                Training {e.trainQueue.length} · {Math.ceil(e.trainQueue[0].remaining)}s
              </div>
            )}
            {e.amount > 0 && e.resourceType && (
              <div className="mt-1 text-xs capitalize text-amber-100">
                {e.resourceType} remaining {Math.ceil(e.amount)}
              </div>
            )}
            {e.carryAmount > 0 && e.carryResource && (
              <div className="mt-1 text-xs capitalize text-amber-100">
                Carrying {Math.ceil(e.carryAmount)} {e.carryResource}
              </div>
            )}
            {canRally && (
              <div className="mt-1 text-xs text-amber-200/80">Right-click map to set rally</div>
            )}
            {commandMode === 'attackMove' && (
              <div className="mt-1 text-xs text-emerald-300">Attack-move: click ground</div>
            )}
          </>
        ) : (
          <div className="text-xs leading-relaxed text-amber-200/70">
            Drag to box-select. Shift-click to add.
            <br />
            F attack-move · . idle villager
            <br />
            Ctrl+1-9 groups · WASD pan
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {hasArmy && (
          <>
            <ActionButton
              onClick={() =>
                useGameStore
                  .getState()
                  .setCommandMode(commandMode === 'attackMove' ? 'none' : 'attackMove')
              }
            >
              <Swords size={14} className="mb-1 inline" /> Attack-move
              <div className="text-[10px] text-amber-200/70">F · fight while moving</div>
            </ActionButton>
            <ActionButton onClick={() => useGameStore.getState().setFormation('box')}>
              <LayoutGrid size={14} className="mb-1 inline" /> Box
              <div className="text-[10px] text-amber-200/70">
                {formation === 'box' ? 'Active' : 'Group formation'}
              </div>
            </ActionButton>
            <ActionButton onClick={() => useGameStore.getState().setFormation('line')}>
              <Spline size={14} className="mb-1 inline" /> Line
              <div className="text-[10px] text-amber-200/70">
                {formation === 'line' ? 'Active' : 'Group formation'}
              </div>
            </ActionButton>
          </>
        )}

        <ActionButton onClick={() => useGameStore.getState().selectIdleVillager()}>
          <PersonStanding size={14} className="mb-1 inline" /> Idle villager
          <div className="text-[10px] text-amber-200/70">. hotkey</div>
        </ActionButton>

        {hasVillager && (
          <>
            {playerCiv === 'british' ? (
              <BuildBtn kind="manor" label="Manor" icon={<House size={14} className="mb-1 inline" />} wood={wood} food={food} gold={gold} placementKind={placementKind} />
            ) : (
              <BuildBtn kind="house" label="House" icon={<House size={14} className="mb-1 inline" />} wood={wood} food={food} gold={gold} placementKind={placementKind} />
            )}

            {playerCiv === 'indian' && (
              <BuildBtn kind="sacredField" label="Sacred Field" icon={<Wheat size={14} className="mb-1 inline" />} wood={wood} food={food} gold={gold} placementKind={placementKind} />
            )}
            {playerCiv === 'japanese' && (
              <BuildBtn kind="toriiShrine" label="Torii Shrine" icon={<Wheat size={14} className="mb-1 inline" />} wood={wood} food={food} gold={gold} placementKind={placementKind} />
            )}
            {playerCiv === 'french' && (
              <BuildBtn kind="chateau" label="Château" icon={<Castle size={14} className="mb-1 inline" />} wood={wood} food={food} gold={gold} placementKind={placementKind} locked={playerAge < 1} />
            )}
            {/* Farm: universal food producer, especially useful for British & French */}
            <BuildBtn kind="farm" label="Farm" icon={<Sprout size={14} className="mb-1 inline" />} wood={wood} food={food} gold={gold} placementKind={placementKind} />

            <BuildBtn kind="lumberCamp" label="Lumber Camp" icon={<Trees size={14} className="mb-1 inline" />} wood={wood} food={food} gold={gold} placementKind={placementKind} />
            <BuildBtn kind="mill" label="Mill" icon={<Sprout size={14} className="mb-1 inline" />} wood={wood} food={food} gold={gold} placementKind={placementKind} />
            <BuildBtn kind="miningCamp" label="Mining Camp" icon={<Pickaxe size={14} className="mb-1 inline" />} wood={wood} food={food} gold={gold} placementKind={placementKind} />
            <BuildBtn kind="palisade" label="Palisade" icon={<Fence size={14} className="mb-1 inline" />} wood={wood} food={food} gold={gold} placementKind={placementKind} />
            <BuildBtn kind="barracks" label="Barracks" icon={<Tent size={14} className="mb-1 inline" />} wood={wood} food={food} gold={gold} placementKind={placementKind} locked={playerAge < 1} />
            <BuildBtn kind="caravanserai" label="Stables" icon={<Zap size={14} className="mb-1 inline" />} wood={wood} food={food} gold={gold} placementKind={placementKind} locked={playerAge < 1} />

            {playerCiv === 'indian' && (
              <BuildBtn kind="agraFort" label="Agra Fort" icon={<TowerControl size={14} className="mb-1 inline" />} wood={wood} food={food} gold={gold} placementKind={placementKind} locked={playerAge < 2} />
            )}
            {playerCiv === 'japanese' && (
              <BuildBtn kind="tenshu" label="Tenshu Castle" icon={<TowerControl size={14} className="mb-1 inline" />} wood={wood} food={food} gold={gold} placementKind={placementKind} locked={playerAge < 2} />
            )}
            {(playerCiv === 'indian' || playerCiv === 'british' || playerCiv === 'french') && (
              <BuildBtn kind="foundry" label="Foundry" icon={<Castle size={14} className="mb-1 inline" />} wood={wood} food={food} gold={gold} placementKind={placementKind} locked={playerAge < 2} />
            )}
            <BuildBtn kind="townCenter" label="Town Center" icon={<Castle size={14} className="mb-1 inline" />} wood={wood} food={food} gold={gold} placementKind={placementKind} />
          </>
        )}

        {e?.kind === 'townCenter' && e.team === 'player' && e.buildProgress >= 1 && (
          <>
            <ActionButton
              disabled={!canAfford(COSTS.villager, wood, food, gold, petrol, metal) || pop >= popCap}
              onClick={() => useGameStore.getState().train('villager')}
            >
              <PersonStanding size={14} className="mb-1 inline" /> Train Villager
              <div className="text-[10px] text-amber-200/70">{costText(COSTS.villager)}</div>
            </ActionButton>
            {playerAge < 4 && (
              <ActionButton
                disabled={
                  aging ||
                  !canAfford(AGE_ADVANCEMENTS[playerAge as 0 | 1 | 2 | 3].cost, wood, food, gold, petrol, metal)
                }
                onClick={() => useGameStore.getState().startAgeUp()}
              >
                <Crown size={14} className="mb-1 inline" />{' '}
                {aging ? 'Advancing…' : `${AGE_ADVANCEMENTS[playerAge as 0 | 1 | 2 | 3].name} Age`}
                <div className="text-[10px] text-amber-200/70">
                  {aging
                    ? `${Math.ceil(ageTimer)}s remaining`
                    : costText(AGE_ADVANCEMENTS[playerAge as 0 | 1 | 2 | 3].cost)}
                </div>
              </ActionButton>
            )}
          </>
        )}

        {hasVillager && <BuildBtn kind="helipad" label="Helipad" icon={<Zap size={14}/>} wood={wood} food={food} gold={gold} placementKind={placementKind} locked={playerAge < 4} />}
        {e && e.team==='player' && e.buildProgress>=1 && (MODERN_TRAINING[e.kind as BuildingKind] ?? []).map(kind => <ActionButton key={kind} disabled={playerAge<4 || !canAfford(COSTS[kind],wood,food,gold,petrol,metal) || pop>=popCap || e.trainQueue.length>=5} onClick={()=>useGameStore.getState().train(kind)}>
          <Swords size={14} className="mb-1 inline" /> {DISPLAY_NAMES[kind]}
          <div className="text-[10px] text-amber-200/70">{playerAge<4 ? 'Requires Modern Age' : costText(COSTS[kind])}</div>
        </ActionButton>)}
        {(e?.kind==='oilWell'||e?.kind==='metalDeposit') && <div className="max-w-xs p-2 text-xs text-amber-200">Modern Age workers drill here. Right-click with villagers selected; deliver supplies to a Mining Camp or Town Center.</div>}
        {e?.kind === 'villager' && e.team === 'player' && (
          <BuildBtn kind="factory" label={playerAge>=4 ? 'Vehicle Factory' : INDUSTRIAL_CIVS[playerCiv].workshop} icon={<Castle size={14} className="mb-1 inline" />} wood={wood} food={food} gold={gold} placementKind={placementKind} locked={playerAge < 3} />
        )}
        {e?.kind==='villager' && e.team==='player' && terrain!=='grassland' && <BuildBtn kind="dock" label="Dock · near shoreline" icon={<Castle size={14}/>} wood={wood} food={food} gold={gold} placementKind={placementKind}/>}
        {e?.kind==='dock' && e.team==='player' && e.buildProgress>=1 && <>
          {(['fishingBoat','transportShip','warship'] as const).map(kind=><ActionButton key={kind} disabled={playerAge<requiredAge(kind)||!canAfford(COSTS[kind],wood,food,gold)||pop>=popCap} onClick={()=>useGameStore.getState().train(kind)}>
            {NAVIES[playerCiv][kind]}
            <div className="text-[10px] text-amber-200/70">{playerAge<requiredAge(kind)?`Requires ${AGE_NAMES[requiredAge(kind)]}`:costText(COSTS[kind])}</div>
          </ActionButton>)}
          <div className="max-w-xs p-2 text-xs text-amber-200/80">{NAVIES[playerCiv].description}<div className="mt-1">Fishing boats deliver food here. Ships use connected waterways.</div></div>
        </>}
        {e?.kind==='transportShip' && e.team==='player' && <>
          <ActionButton disabled={!e.passengers?.length} onClick={()=>useGameStore.getState().unloadTransport()}>
            Unload troops · {e.passengers?.length??0}/{NAVIES[playerCiv].capacity}
            <div className="text-[10px] text-amber-200/70">Sail within 7 tiles of a clear shoreline.</div>
          </ActionButton>
          <div className="max-w-xs p-2 text-xs text-amber-200/80">To board: bring the ship close to shore, select land troops and right-click the transport. Passengers count toward population.</div>
        </>}
        {e?.kind==='fishingBoat' && <div className="max-w-xs p-2 text-xs text-amber-200/80">Right-click fish to gather food. This boat also finds fish automatically and returns its catch to a Dock.</div>}
        {e?.kind==='fish' && <div className="max-w-xs p-2 text-xs text-amber-200/80">{e.shoreFish?'Villagers can fish from the bank. Fishing boats can gather here too.':'Requires a fishing boat. Build a Dock on nearby dry shoreline.'}</div>}
        {e?.kind === 'factory' && e.team === 'player' && e.buildProgress >= 1 && (
          <ActionButton disabled={playerAge < 3 || !canAfford(COSTS[INDUSTRIAL_CIVS[playerCiv].artillery], wood, food, gold, petrol, metal) || pop >= popCap} onClick={() => useGameStore.getState().train(INDUSTRIAL_CIVS[playerCiv].artillery)}>
            Train {DISPLAY_NAMES[INDUSTRIAL_CIVS[playerCiv].artillery]}
            <div className="text-[10px] text-amber-200/70">{costText(COSTS[INDUSTRIAL_CIVS[playerCiv].artillery])}</div>
            <div className="text-[10px] text-amber-200/70">Workshop: +2 wood & gold / second · Limit 2</div>
          </ActionButton>
        )}
        {e?.kind === 'townCenter' && e.team === 'player' && playerAge >= 2 && (
          <div className="max-w-xs rounded border border-amber-500/40 bg-amber-950/60 p-3 text-xs text-amber-100">
            <div className="mb-1 font-bold">IV · {INDUSTRIAL_CIVS[playerCiv].title}</div>
            {INDUSTRIAL_CIVS[playerCiv].description}
            <div className="mt-1 text-amber-200/70">Other troops +25% health & attack. Buildings +35% health. Gatherers +20% speed, +5 carry. Unlocks {INDUSTRIAL_CIVS[playerCiv].workshop}.</div>
          </div>
        )}
        {e?.kind === 'barracks' && e.team === 'player' && e.buildProgress >= 1 && (
          <>
            {playerCiv === 'indian' && (
              <>
                <ActionButton
                  disabled={!canAfford(COSTS.sepoy, wood, food, gold, petrol, metal) || pop >= popCap}
                  onClick={() => useGameStore.getState().train('sepoy')}
                >
                  <Swords size={14} className="mb-1 inline" /> Train Sepoy
                  <div className="text-[10px] text-amber-200/70">{costText(COSTS.sepoy)}</div>
                </ActionButton>
                <ActionButton
                  disabled={!canAfford(COSTS.rajput, wood, food, gold, petrol, metal) || pop >= popCap}
                  onClick={() => useGameStore.getState().train('rajput')}
                >
                  <Swords size={14} className="mb-1 inline" /> Train Rajput
                  <div className="text-[10px] text-amber-200/70">{costText(COSTS.rajput)}</div>
                </ActionButton>
                <ActionButton
                  disabled={playerAge < 2 || !canAfford(COSTS.gurkha, wood, food, gold, petrol, metal) || pop >= popCap}
                  onClick={() => useGameStore.getState().train('gurkha')}
                >
                  <Target size={14} className="mb-1 inline" /> Train Gurkha
                  <div className="text-[10px] text-amber-200/70">
                    {playerAge < 2 ? 'Requires Fortress Age' : costText(COSTS.gurkha)}
                  </div>
                </ActionButton>
              </>
            )}

            {playerCiv === 'british' && (
              <>
                <ActionButton
                  disabled={!canAfford(COSTS.pikeman, wood, food, gold, petrol, metal) || pop >= popCap}
                  onClick={() => useGameStore.getState().train('pikeman')}
                >
                  <Swords size={14} className="mb-1 inline" /> Train Pikeman
                  <div className="text-[10px] text-amber-200/70">{costText(COSTS.pikeman)}</div>
                </ActionButton>
                <ActionButton
                  disabled={!canAfford(COSTS.longbowman, wood, food, gold, petrol, metal) || pop >= popCap}
                  onClick={() => useGameStore.getState().train('longbowman')}
                >
                  <Target size={14} className="mb-1 inline" /> Train Longbowman
                  <div className="text-[10px] text-amber-200/70">{costText(COSTS.longbowman)}</div>
                </ActionButton>
                <ActionButton
                  disabled={playerAge < 2 || !canAfford(COSTS.redcoat, wood, food, gold, petrol, metal) || pop >= popCap}
                  onClick={() => useGameStore.getState().train('redcoat')}
                >
                  <Swords size={14} className="mb-1 inline" /> Train Redcoat
                  <div className="text-[10px] text-amber-200/70">
                    {playerAge < 2 ? 'Requires Fortress Age' : costText(COSTS.redcoat)}
                  </div>
                </ActionButton>
              </>
            )}

            {playerCiv === 'japanese' && (
              <>
                <ActionButton
                  disabled={!canAfford(COSTS.ashigaru, wood, food, gold, petrol, metal) || pop >= popCap}
                  onClick={() => useGameStore.getState().train('ashigaru')}
                >
                  <Swords size={14} className="mb-1 inline" /> Train Ashigaru
                  <div className="text-[10px] text-amber-200/70">{costText(COSTS.ashigaru)}</div>
                </ActionButton>
                <ActionButton
                  disabled={!canAfford(COSTS.yumiArcher, wood, food, gold, petrol, metal) || pop >= popCap}
                  onClick={() => useGameStore.getState().train('yumiArcher')}
                >
                  <Target size={14} className="mb-1 inline" /> Train Yumi Archer
                  <div className="text-[10px] text-amber-200/70">{costText(COSTS.yumiArcher)}</div>
                </ActionButton>
                <ActionButton
                  disabled={playerAge < 2 || !canAfford(COSTS.samurai, wood, food, gold, petrol, metal) || pop >= popCap}
                  onClick={() => useGameStore.getState().train('samurai')}
                >
                  <Crown size={14} className="mb-1 inline" /> Train Samurai
                  <div className="text-[10px] text-amber-200/70">
                    {playerAge < 2 ? 'Requires Fortress Age' : costText(COSTS.samurai)}
                  </div>
                </ActionButton>
              </>
            )}

            {playerCiv === 'french' && (
              <>
                <ActionButton
                  disabled={!canAfford(COSTS.crossbowman, wood, food, gold, petrol, metal) || pop >= popCap}
                  onClick={() => useGameStore.getState().train('crossbowman')}
                >
                  <Target size={14} className="mb-1 inline" /> Train Crossbowman
                  <div className="text-[10px] text-amber-200/70">{costText(COSTS.crossbowman)}</div>
                </ActionButton>
                <ActionButton
                  disabled={!canAfford(COSTS.halberdier, wood, food, gold, petrol, metal) || pop >= popCap}
                  onClick={() => useGameStore.getState().train('halberdier')}
                >
                  <Swords size={14} className="mb-1 inline" /> Train Halberdier
                  <div className="text-[10px] text-amber-200/70">{costText(COSTS.halberdier)}</div>
                </ActionButton>
              </>
            )}
          </>
        )}

        {e?.kind === 'caravanserai' && e.team === 'player' && e.buildProgress >= 1 && (
          <>
            {playerCiv === 'indian' && (
              <>
                <ActionButton
                  disabled={!canAfford(COSTS.sowar, wood, food, gold, petrol, metal) || pop >= popCap}
                  onClick={() => useGameStore.getState().train('sowar')}
                >
                  <Zap size={14} className="mb-1 inline" /> Train Sowar
                  <div className="text-[10px] text-amber-200/70">{costText(COSTS.sowar)}</div>
                </ActionButton>
                <ActionButton
                  disabled={playerAge < 2 || !canAfford(COSTS.mahout, wood, food, gold, petrol, metal) || pop >= popCap}
                  onClick={() => useGameStore.getState().train('mahout')}
                >
                  <Swords size={14} className="mb-1 inline" /> Train Mahout
                  <div className="text-[10px] text-amber-200/70">
                    {playerAge < 2 ? 'Requires Fortress Age' : costText(COSTS.mahout)}
                  </div>
                </ActionButton>
              </>
            )}

            {playerCiv === 'british' && (
              <>
                <ActionButton
                  disabled={!canAfford(COSTS.hussar, wood, food, gold, petrol, metal) || pop >= popCap}
                  onClick={() => useGameStore.getState().train('hussar')}
                >
                  <Zap size={14} className="mb-1 inline" /> Train Hussar
                  <div className="text-[10px] text-amber-200/70">{costText(COSTS.hussar)}</div>
                </ActionButton>
                <ActionButton
                  disabled={playerAge < 2 || !canAfford(COSTS.dragoon, wood, food, gold, petrol, metal) || pop >= popCap}
                  onClick={() => useGameStore.getState().train('dragoon')}
                >
                  <Swords size={14} className="mb-1 inline" /> Train Dragoon
                  <div className="text-[10px] text-amber-200/70">
                    {playerAge < 2 ? 'Requires Fortress Age' : costText(COSTS.dragoon)}
                  </div>
                </ActionButton>
              </>
            )}

            {playerCiv === 'japanese' && (
              <ActionButton
                disabled={playerAge < 2 || !canAfford(COSTS.naginata, wood, food, gold, petrol, metal) || pop >= popCap}
                onClick={() => useGameStore.getState().train('naginata')}
              >
                <Zap size={14} className="mb-1 inline" /> Train Naginata Rider
                <div className="text-[10px] text-amber-200/70">
                  {playerAge < 2 ? 'Requires Fortress Age' : costText(COSTS.naginata)}
                </div>
              </ActionButton>
            )}

            {playerCiv === 'french' && (
              <ActionButton
                disabled={playerAge < 2 || !canAfford(COSTS.cuirassier, wood, food, gold, petrol, metal) || pop >= popCap}
                onClick={() => useGameStore.getState().train('cuirassier')}
              >
                <Zap size={14} className="mb-1 inline" /> Train Cuirassier
                <div className="text-[10px] text-amber-200/70">
                  {playerAge < 2 ? 'Requires Fortress Age' : costText(COSTS.cuirassier)}
                </div>
              </ActionButton>
            )}
          </>
        )}

        {e?.kind === 'foundry' && e.team === 'player' && e.buildProgress >= 1 && (
          <>
            {playerCiv === 'indian' && (
              <ActionButton
                disabled={!canAfford(COSTS.siegeElephant, wood, food, gold, petrol, metal) || pop >= popCap}
                onClick={() => useGameStore.getState().train('siegeElephant')}
              >
                <Swords size={14} className="mb-1 inline" /> Siege Elephant
                <div className="text-[10px] text-amber-200/70">{costText(COSTS.siegeElephant)}</div>
              </ActionButton>
            )}
            {playerCiv === 'british' && (
              <ActionButton
                disabled={!canAfford(COSTS.falconet, wood, food, gold, petrol, metal) || pop >= popCap}
                onClick={() => useGameStore.getState().train('falconet')}
              >
                <Swords size={14} className="mb-1 inline" /> Train Falconet
                <div className="text-[10px] text-amber-200/70">{costText(COSTS.falconet)}</div>
              </ActionButton>
            )}
            {playerCiv === 'french' && (
              <ActionButton
                disabled={!canAfford(COSTS.falconet, wood, food, gold, petrol, metal) || pop >= popCap}
                onClick={() => useGameStore.getState().train('falconet')}
              >
                <Swords size={14} className="mb-1 inline" /> Train Falconet
                <div className="text-[10px] text-amber-200/70">{costText(COSTS.falconet)}</div>
              </ActionButton>
            )}
          </>
        )}
      </div>
    </div>
  )
}
