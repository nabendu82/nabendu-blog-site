# Sovereign Clash player guide

## Modern Age: civilization identities

All four civilizations reach Modern Age from Industrial at the Town Center for **3,000 Food + 2,200 Gold**, taking 80 seconds. Bonuses apply equally to the player and enemy. Existing modern units receive their civilization modifiers once without healing damage; newly trained units receive them too. Earlier-age units retain their existing bonuses.

These identities are inspired by real equipment. **All percentages, weaknesses, ranges, costs and firing schedules below are fictional game-balance choices**, not comparisons of actual national military capability. Models are stylized, not exact replicas.

| Civilization | Modern advantage | Disadvantage and counterplay |
| --- | --- | --- |
| India | Exclusive **Pinaka Rocket Launcher** at the Vehicle Factory. Six rockets per salvo, area damage, 23 range, wheeled mobility. | Six-second reload, 240 HP, cannot attack aircraft. Indian helicopters have 15% less HP. Spread out, flank the launcher or use aircraft. |
| Britain | **Daring Destroyer**: +25% HP, +3 range, +50% damage against helicopters. | Heavy Artillery moves 20% slower. Its main advantage is unavailable on land-only maps; pressure the land army or use concentrated coastal artillery. |
| Japan | **Type 10 Mobile Tank**: +25% speed and 15% shorter reload. Recon Jeeps gain +20% speed. | Tanks have 15% less HP. Use mobility and flanking; rocket troops punish stationary tanks. |
| France | **Tiger Attack Helicopter**: +25% attack and +15% speed. | Tanks have 15% less HP. Protect air units from rocket troops and destroyers; ground forces are less durable. |

Modifiers use base unit statistics, with health and attack rounded to whole numbers. Japanese tank reload is 1.36 seconds instead of 1.6. British destroyers have 1,688 HP and 22 range. French helicopters have 48 attack and 10.35 speed. Japanese and French tanks have 808 HP. Indian helicopters have 357 HP. Existing naval bonuses still apply: Japanese ships have +15% HP; French ships have +10% speed; British historical cannon ships have +2 range.

### Training and Pinaka

- Barracks: Rifleman, Machine Gunner, Rocket Trooper.
- Vehicle Factory: Tank, Heavy Artillery, Recon Jeep; **India additionally unlocks Pinaka**.
- Helipad: Attack Helicopter (Tiger variant for France).
- Dock: Destroyer (Daring variant for Britain), plus historical fishing, transport and cannon ships.

Pinaka costs **280 Gold + 380 Metal + 130 Petrol**, trains in **40 seconds**, and uses one population slot, like other units. It has 240 HP, 3.6 speed, 26 damage per rocket, 4.4 splash radius and 23 attack range. A salvo launches six projectiles approximately 0.16 seconds apart; its six-second reload begins with the first shot. Buildings receive the existing siege multiplier. It needs scouts to exploit its full range. Moving, boarding, losing its target or losing range cancels the remaining salvo without refunding the reload. The visible twelve-tube rack and six-shot gameplay salvo are an abstraction.

The enemy Indian army includes Pinaka in Modern Age raids and pays the normal resource cost. Other civilizations keep Heavy Artillery in that roster. All civilization bonuses and penalties apply to enemy forces as well.

## Economy and long matches

Food, Wood and Gold remain in use. Workers can drill Petrol and Metal after reaching Modern Age and deliver them to a Mining Camp or Town Center. Each side has two deposits of each type on every terrain: **96,000 Metal** and **48,000 Petrol** in total. These finite reserves give extended matches more headroom; gathering rates and army spending still determine how long supplies last.

## Difficulty

| Difficulty | First raid dispatched | Enemy Commerce / Fortress / Industrial / Modern | Later raid interval |
| --- | --- | --- | --- |
| Easy | 10:00 | 8:00 / 18:00 / 30:00 / 40:00 | 4:00 |
| Medium | 6:00 | 4:48 / 10:48 / 18:00 / 24:00 | 2:24 |
| Hard | 3:30 | 2:48 / 6:18 / 10:30 / 14:00 | 1:24 |

Once both sides reach Modern Age on Medium, later raids arrive every **2:42** instead of 2:24 (12.5% more recovery time). Other difficulties, earlier ages and unit strength are unchanged.

The **original Town Center** is each side’s main headquarters. Its destruction ends the match after the collapse animation, even if additional Town Centers survive. Losing an expansion Town Center does not end the match.

Travel time follows dispatch. Rematches preserve difficulty, terrain and civilizations.

## Terrain and transport

All four battlefields are 320 × 320: Emerald Plains, Great Lake, Two Crossings and Sundering Sea. The sea has no land crossing or route around its edges. Fly helicopters across or transport ground armies by ship; warships can contest the sea and bombard the coast. Enemies perform transport landings too.

Transports become steamships in Industrial and landing ships in Modern. They gain speed, health and capacity while retaining passengers and damage. Base capacity is 10 (12 for France), Industrial adds 4, and Modern adds 10 instead. Sail within seven tiles of a clear shore and unload; passengers are placed farther inland when needed to avoid crowding.

## Research sources

- [India’s Ministry of Defence / PIB: Guided Pinaka validation trials](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2073384&lang=2&reg=48) describes the Pinaka rocket system. This informed India’s rocket-artillery identity.
- [Royal Navy: Daring-class Type 45 destroyer](https://www.royalnavy.mod.uk/equipment/ships/daring-class) describes its air-defence role. This informed Britain’s fleet defence specialization.
- [Japan Ministry of Defense equipment guide, page 5](https://www.mod.go.jp/j/approach/hyouka/yosan_shikko/2018/04.pdf#page=5) describes Type 10 mobile-strike capability and its automatic loader. This informed Japan’s mobile-armor identity.
- [Airbus: Tiger military helicopter](https://www.airbus.com/en/products-services/helicopters/military-helicopters/tiger) and [Tiger service with the French army](https://www.airbus.com/en/newsroom/news/2021-04-the-tiger-combat-helicopter-three-decades-of-flight-and-many-more-to-come) informed France’s air-assault identity.

## Implementation and verification

The shared `game/modern.ts` module defines modifiers, display names and civilization-specific training. It supplies the empire selection, command panel and help overlay. `game/progression.ts` applies health, speed, range and attack adjustments once; the simulation applies reload and anti-air modifiers and schedules Pinaka salvos. Run `npm run test:game` for economy, progression, combat, terrain and navy checks.
