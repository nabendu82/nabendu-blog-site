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
import { COSTS, DISPLAY_NAMES, AGE_NAMES } from '../game/constants'
import { canAfford, useGameStore } from '../game/store'
import { isBuilding, isMilitary, isUnit, requiredAge, type Entity, type PlacementKind } from '../game/types'

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

function costText(cost: { wood?: number; food?: number; gold?: number }): string {
  const parts: string[] = []
  if (cost.wood) parts.push(`${cost.wood} Wood`)
  if (cost.food) parts.push(`${cost.food} Food`)
  if (cost.gold) parts.push(`${cost.gold} Gold`)
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
  return (
    <ActionButton
      disabled={!!locked || !canAfford(COSTS[kind], wood, food, gold)}
      onClick={() => useGameStore.getState().setPlacement(kind)}
    >
      {icon} {label}
      <div className="text-[10px] text-amber-200/70">
        {locked ? `Requires ${AGE_NAMES[requiredAge(kind)]}` : costText(COSTS[kind])}
      </div>
      {placementKind === kind && <div className="text-[10px] text-emerald-300">Click map to place</div>}
    </ActionButton>
  )
}

export function CommandBar() {
  const selectedId = useGameStore((s) => s.selectedId)
  const selectedIds = useGameStore((s) => s.selectedIds)
  const wood = useGameStore((s) => s.wood)
  const food = useGameStore((s) => s.food)
  const gold = useGameStore((s) => s.gold)
  const pop = useGameStore((s) => s.pop)
  const popCap = useGameStore((s) => s.popCap)
  const placementKind = useGameStore((s) => s.placementKind)
  const commandMode = useGameStore((s) => s.commandMode)
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
        u.kind === 'foundry') &&
      u.buildProgress >= 1,
  )

  const title =
    count === 0
      ? null
      : count === 1
        ? (DISPLAY_NAMES[e!.kind] ?? e!.kind)
        : `${count} selected`

  return (
    <div className="pointer-events-auto flex w-full max-w-6xl items-stretch gap-4 rounded-t-md border-x border-t border-amber-700/60 bg-gradient-to-b from-[#2c1e10] to-[#1a120a] px-4 py-3 shadow-2xl">
      <div className="w-56 shrink-0 border-r border-amber-800/50 pr-4">
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
            {playerCiv === 'ottoman' && (
              <BuildBtn kind="mosque" label="Mosque" icon={<Castle size={14} className="mb-1 inline" />} wood={wood} food={food} gold={gold} placementKind={placementKind} />
            )}

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
            {(playerCiv === 'indian' || playerCiv === 'british' || playerCiv === 'ottoman') && (
              <BuildBtn kind="foundry" label="Foundry" icon={<Castle size={14} className="mb-1 inline" />} wood={wood} food={food} gold={gold} placementKind={placementKind} locked={playerAge < 2} />
            )}
            <BuildBtn kind="townCenter" label="Town Center" icon={<Castle size={14} className="mb-1 inline" />} wood={wood} food={food} gold={gold} placementKind={placementKind} />
          </>
        )}

        {e?.kind === 'townCenter' && e.team === 'player' && e.buildProgress >= 1 && (
          <>
            <ActionButton
              disabled={!canAfford(COSTS.villager, wood, food, gold) || pop >= popCap}
              onClick={() => useGameStore.getState().train('villager')}
            >
              <PersonStanding size={14} className="mb-1 inline" /> Train Villager
              <div className="text-[10px] text-amber-200/70">{costText(COSTS.villager)}</div>
            </ActionButton>
            {playerAge < 2 && (
              <ActionButton
                disabled={
                  aging ||
                  !canAfford(playerAge === 0 ? COSTS.commerce : COSTS.fortress, wood, food, gold)
                }
                onClick={() => useGameStore.getState().startAgeUp()}
              >
                <Crown size={14} className="mb-1 inline" />{' '}
                {aging ? 'Advancing…' : playerAge === 0 ? 'Commerce Age' : 'Fortress Age'}
                <div className="text-[10px] text-amber-200/70">
                  {aging
                    ? `${Math.ceil(ageTimer)}s remaining`
                    : costText(playerAge === 0 ? COSTS.commerce : COSTS.fortress)}
                </div>
              </ActionButton>
            )}
          </>
        )}

        {e?.kind === 'barracks' && e.team === 'player' && e.buildProgress >= 1 && (
          <>
            {playerCiv === 'indian' && (
              <>
                <ActionButton
                  disabled={!canAfford(COSTS.sepoy, wood, food, gold) || pop >= popCap}
                  onClick={() => useGameStore.getState().train('sepoy')}
                >
                  <Swords size={14} className="mb-1 inline" /> Train Sepoy
                  <div className="text-[10px] text-amber-200/70">{costText(COSTS.sepoy)}</div>
                </ActionButton>
                <ActionButton
                  disabled={!canAfford(COSTS.rajput, wood, food, gold) || pop >= popCap}
                  onClick={() => useGameStore.getState().train('rajput')}
                >
                  <Swords size={14} className="mb-1 inline" /> Train Rajput
                  <div className="text-[10px] text-amber-200/70">{costText(COSTS.rajput)}</div>
                </ActionButton>
                <ActionButton
                  disabled={playerAge < 2 || !canAfford(COSTS.gurkha, wood, food, gold) || pop >= popCap}
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
                  disabled={!canAfford(COSTS.pikeman, wood, food, gold) || pop >= popCap}
                  onClick={() => useGameStore.getState().train('pikeman')}
                >
                  <Swords size={14} className="mb-1 inline" /> Train Pikeman
                  <div className="text-[10px] text-amber-200/70">{costText(COSTS.pikeman)}</div>
                </ActionButton>
                <ActionButton
                  disabled={!canAfford(COSTS.longbowman, wood, food, gold) || pop >= popCap}
                  onClick={() => useGameStore.getState().train('longbowman')}
                >
                  <Target size={14} className="mb-1 inline" /> Train Longbowman
                  <div className="text-[10px] text-amber-200/70">{costText(COSTS.longbowman)}</div>
                </ActionButton>
                <ActionButton
                  disabled={playerAge < 2 || !canAfford(COSTS.redcoat, wood, food, gold) || pop >= popCap}
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
                  disabled={!canAfford(COSTS.ashigaru, wood, food, gold) || pop >= popCap}
                  onClick={() => useGameStore.getState().train('ashigaru')}
                >
                  <Swords size={14} className="mb-1 inline" /> Train Ashigaru
                  <div className="text-[10px] text-amber-200/70">{costText(COSTS.ashigaru)}</div>
                </ActionButton>
                <ActionButton
                  disabled={!canAfford(COSTS.yumiArcher, wood, food, gold) || pop >= popCap}
                  onClick={() => useGameStore.getState().train('yumiArcher')}
                >
                  <Target size={14} className="mb-1 inline" /> Train Yumi Archer
                  <div className="text-[10px] text-amber-200/70">{costText(COSTS.yumiArcher)}</div>
                </ActionButton>
                <ActionButton
                  disabled={playerAge < 2 || !canAfford(COSTS.samurai, wood, food, gold) || pop >= popCap}
                  onClick={() => useGameStore.getState().train('samurai')}
                >
                  <Crown size={14} className="mb-1 inline" /> Train Samurai
                  <div className="text-[10px] text-amber-200/70">
                    {playerAge < 2 ? 'Requires Fortress Age' : costText(COSTS.samurai)}
                  </div>
                </ActionButton>
              </>
            )}

            {playerCiv === 'ottoman' && (
              <>
                <ActionButton
                  disabled={!canAfford(COSTS.bashiBazouk, wood, food, gold) || pop >= popCap}
                  onClick={() => useGameStore.getState().train('bashiBazouk')}
                >
                  <Swords size={14} className="mb-1 inline" /> Train Bashi-Bazouk
                  <div className="text-[10px] text-amber-200/70">{costText(COSTS.bashiBazouk)}</div>
                </ActionButton>
                <ActionButton
                  disabled={!canAfford(COSTS.janissary, wood, food, gold) || pop >= popCap}
                  onClick={() => useGameStore.getState().train('janissary')}
                >
                  <Target size={14} className="mb-1 inline" /> Train Janissary
                  <div className="text-[10px] text-amber-200/70">{costText(COSTS.janissary)}</div>
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
                  disabled={!canAfford(COSTS.sowar, wood, food, gold) || pop >= popCap}
                  onClick={() => useGameStore.getState().train('sowar')}
                >
                  <Zap size={14} className="mb-1 inline" /> Train Sowar
                  <div className="text-[10px] text-amber-200/70">{costText(COSTS.sowar)}</div>
                </ActionButton>
                <ActionButton
                  disabled={playerAge < 2 || !canAfford(COSTS.mahout, wood, food, gold) || pop >= popCap}
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
                  disabled={!canAfford(COSTS.hussar, wood, food, gold) || pop >= popCap}
                  onClick={() => useGameStore.getState().train('hussar')}
                >
                  <Zap size={14} className="mb-1 inline" /> Train Hussar
                  <div className="text-[10px] text-amber-200/70">{costText(COSTS.hussar)}</div>
                </ActionButton>
                <ActionButton
                  disabled={playerAge < 2 || !canAfford(COSTS.dragoon, wood, food, gold) || pop >= popCap}
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
                disabled={playerAge < 2 || !canAfford(COSTS.naginata, wood, food, gold) || pop >= popCap}
                onClick={() => useGameStore.getState().train('naginata')}
              >
                <Zap size={14} className="mb-1 inline" /> Train Naginata Rider
                <div className="text-[10px] text-amber-200/70">
                  {playerAge < 2 ? 'Requires Fortress Age' : costText(COSTS.naginata)}
                </div>
              </ActionButton>
            )}

            {playerCiv === 'ottoman' && (
              <ActionButton
                disabled={playerAge < 2 || !canAfford(COSTS.spahi, wood, food, gold) || pop >= popCap}
                onClick={() => useGameStore.getState().train('spahi')}
              >
                <Zap size={14} className="mb-1 inline" /> Train Spahi Cavalry
                <div className="text-[10px] text-amber-200/70">
                  {playerAge < 2 ? 'Requires Fortress Age' : costText(COSTS.spahi)}
                </div>
              </ActionButton>
            )}
          </>
        )}

        {e?.kind === 'foundry' && e.team === 'player' && e.buildProgress >= 1 && (
          <>
            {playerCiv === 'indian' && (
              <ActionButton
                disabled={!canAfford(COSTS.siegeElephant, wood, food, gold) || pop >= popCap}
                onClick={() => useGameStore.getState().train('siegeElephant')}
              >
                <Swords size={14} className="mb-1 inline" /> Siege Elephant
                <div className="text-[10px] text-amber-200/70">{costText(COSTS.siegeElephant)}</div>
              </ActionButton>
            )}
            {playerCiv === 'british' && (
              <ActionButton
                disabled={!canAfford(COSTS.falconet, wood, food, gold) || pop >= popCap}
                onClick={() => useGameStore.getState().train('falconet')}
              >
                <Swords size={14} className="mb-1 inline" /> Train Falconet
                <div className="text-[10px] text-amber-200/70">{costText(COSTS.falconet)}</div>
              </ActionButton>
            )}
            {playerCiv === 'ottoman' && (
              <ActionButton
                disabled={!canAfford(COSTS.greatBombard, wood, food, gold) || pop >= popCap}
                onClick={() => useGameStore.getState().train('greatBombard')}
              >
                <Castle size={14} className="mb-1 inline" /> Great Bombard
                <div className="text-[10px] text-amber-200/70">{costText(COSTS.greatBombard)}</div>
              </ActionButton>
            )}
          </>
        )}
      </div>
    </div>
  )
}
