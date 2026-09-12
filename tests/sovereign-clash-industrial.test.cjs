const fs = require('node:fs')
const ts = require('typescript')
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename)
const { test } = require('node:test')
const assert = require('node:assert/strict')
const root = '../components/games/sovereign-clash/game/'
const { useGameStore, spawnUnit } = require(root + 'store.ts')
const { createUnit, createBuilding, createResource } = require(root + 'mapGen.ts')
const { applyIndustrialUpgrade } = require(root + 'progression.ts')
const { tickSimulation } = require(root + 'simulation.ts')
const { INDUSTRIAL_CIVS, UNIT_STATS } = require(root + 'constants.ts')

function world(civ, age = 2) {
  useGameStore.getState().setCivilizations(civ, civ)
  const tc = createBuilding('tc', 'townCenter', 'player', -55, -55, true)
  const enemy = createBuilding('enemy', 'townCenter', 'enemy', 55, 55, true)
  useGameStore.setState({ entities: { tc, enemy }, selectedId: 'tc', selectedIds: ['tc'],
    playerAge: age, enemyAge: 2, wood: 10000, food: 10000, gold: 10000,
    helpOpen: false, civModalOpen: false, winner: null, aging: false, gameTime: 0,
    nextId: 10000, waveIndex: 3, waveStartTime: 0 })
  return tc
}

for (const civ of Object.keys(INDUSTRIAL_CIVS)) {
  test(`${civ}: Industrial age costs, damage preservation and repeat-safe promotions`, () => {
    const tc = world(civ)
    const kind = INDUSTRIAL_CIVS[civ].guards[0]
    const guard = createUnit('guard', kind, 'player', -50, -50)
    guard.hp /= 2
    useGameStore.getState().entities.guard = guard
    useGameStore.getState().startAgeUp()
    assert.equal(useGameStore.getState().food, 8000)
    assert.equal(useGameStore.getState().gold, 8800)
    assert.equal(useGameStore.getState().ageTimer, 60)
    useGameStore.setState({ ageTimer: 0.01 })
    tickSimulation(0.05)
    assert.equal(useGameStore.getState().playerAge, 3)
    assert.equal(guard.maxHp, Math.round(UNIT_STATS[kind].hp * 1.4))
    assert.equal(guard.hp, guard.maxHp / 2)
    assert.equal(tc.maxHp, 945)
    const max = guard.maxHp
    tickSimulation(0.05)
    assert.equal(guard.maxHp, max)
    const fresh = spawnUnit(kind, 'player', tc)
    assert.equal(fresh.maxHp, max)
    assert.equal(fresh.hp, max)
    useGameStore.getState().startAgeUp()
    assert.equal(useGameStore.getState().aging, true) // Industrial can now advance to Modern.
  })
  test(`${civ}: unique artillery requires Industrial and the correct workshop`, () => {
    world(civ)
    const factory = createBuilding('factory', 'factory', 'player', -40, -40, true)
    useGameStore.getState().entities.factory = factory
    useGameStore.setState({ selectedId: 'factory', selectedIds: ['factory'] })
    const kind = INDUSTRIAL_CIVS[civ].artillery
    useGameStore.getState().train(kind)
    assert.equal(factory.trainQueue.length, 0)
    useGameStore.setState({ playerAge: 3 })
    useGameStore.getState().train(kind)
    assert.equal(factory.trainQueue.length, 1)
    const wrong = Object.values(INDUSTRIAL_CIVS).find(c => c.artillery !== kind).artillery
    useGameStore.getState().train(wrong)
    assert.equal(factory.trainQueue.length, 1)
    factory.trainQueue[0].remaining = 0.01
    tickSimulation(0.05)
    const artillery = Object.values(useGameStore.getState().entities).find(e => e.kind === kind)
    assert.ok(artillery)
    assert.equal(artillery.maxHp, UNIT_STATS[kind].hp)
    assert.equal(artillery.splash, UNIT_STATS[kind].splash)
  })
  test(`${civ}: enemy reaches Industrial and sends civilization artillery`, () => {
    world(civ)
    useGameStore.setState({ gameTime: 1800, waveIndex: 3, waveStartTime: 1560 })
    tickSimulation(0.05)
    tickSimulation(0.05)
    const s = useGameStore.getState()
    assert.equal(s.enemyAge, 3)
    assert.ok(Object.values(s.entities).some(e => e.team === 'enemy' && e.kind === 'factory'))
    assert.ok(Object.values(s.entities).some(e => e.team === 'enemy' && e.kind === INDUSTRIAL_CIVS[civ].artillery))
    assert.equal(s.entities.enemy.maxHp, 945)
  })
}

test('unfinished buildings preserve progress and do not receive repeated health boosts', () => {
  const b = createBuilding('b', 'house', 'player', 0, 0, false)
  const ratio = b.hp / b.maxHp
  const progress = b.buildProgress
  applyIndustrialUpgrade(b, 'french', 3)
  assert.equal(b.hp / b.maxHp, ratio)
  assert.equal(b.buildProgress, progress)
  applyIndustrialUpgrade(b, 'french', 3)
  assert.equal(b.maxHp, 270)
})

test('workshops generate whole resources and stop when destroyed', () => {
  world('british', 3)
  const factory = createBuilding('factory', 'factory', 'player', -40, -40, true)
  useGameStore.getState().entities.factory = factory
  for (let i = 0; i < 20; i++) tickSimulation(0.1)
  assert.equal(useGameStore.getState().wood, 10004)
  assert.equal(useGameStore.getState().gold, 10004)
  factory.dying = true
  factory.deathTimer = 1.8
  for (let i = 0; i < 20; i++) tickSimulation(0.1)
  assert.equal(useGameStore.getState().wood, 10004)
})

test('workshop limit counts unfinished sites and releases destroyed sites', () => {
  world('british', 3)
  const s = useGameStore.getState()
  s.entities.worker = createUnit('worker', 'villager', 'player', 0, 0)
  s.entities.first = createBuilding('first', 'factory', 'player', 20, 20, true)
  s.entities.second = createBuilding('second', 'factory', 'player', 30, 30, false)
  useGameStore.setState({ selectedId: 'worker', selectedIds: ['worker'], placementKind: 'factory' })
  assert.equal(useGameStore.getState().placeBuilding(0, 0), false)
  assert.equal(useGameStore.getState().wood, 10000)
  s.entities.second.dying = true
  assert.equal(useGameStore.getState().placeBuilding(0, 0), true)
  assert.equal(useGameStore.getState().wood, 9400)
})

test('age advancement refuses insufficient resources', () => {
  world('french')
  useGameStore.setState({ food: 1999 })
  useGameStore.getState().startAgeUp()
  assert.equal(useGameStore.getState().aging, false)
  assert.equal(useGameStore.getState().gold, 10000)
})

for (const civ of ['british', 'french']) {
  test(`${civ}: Industrial gathering stacks with civilization bonus and uses larger capacity`, () => {
    world(civ, 3)
    const worker = createUnit('worker', 'villager', 'player', 0, 0)
    const tree = createResource('tree', 'tree', 0, 1)
    worker.order = { type: 'gather', x: 0, z: 1, targetId: 'tree' }
    Object.assign(useGameStore.getState().entities, { worker, tree })
    tickSimulation(0.1)
    assert.ok(Math.abs(worker.carryAmount - (civ === 'french' ? 1.5 : 1.2)) < 0.001)
    worker.carryAmount = civ === 'french' ? 22.5 : 19.5
    tickSimulation(0.1)
    assert.equal(worker.carryAmount, civ === 'french' ? 23 : 20)
    assert.equal(worker.order.type, 'return')
  })
}
