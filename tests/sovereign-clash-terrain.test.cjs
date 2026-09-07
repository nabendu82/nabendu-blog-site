const fs = require('node:fs'), ts = require('typescript')
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'), {
  compilerOptions: {module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true},
}).outputText,filename)
const {test} = require('node:test'), assert = require('node:assert/strict')
const root='../components/games/sovereign-clash/game/'
const {TERRAINS,isDry,isWater,riverCenter,CROSSINGS,terrainRoute,setActiveTerrain,drySegment} = require(root+'terrain.ts')
const {generateWorld,createUnit,createBuilding} = require(root+'mapGen.ts')
const {moveTowards} = require(root+'pathfinding.ts')
const {useGameStore,isPlacementValid,spawnUnit} = require(root+'store.ts')

for (const terrain of Object.keys(TERRAINS)) {
  test(`${terrain}: every civilization starts and gathers on dry land`,()=>{
    for (const civ of ['british','french','indian','japanese']) {
      const world=generateWorld(civ,terrain)
      assert.ok(Object.keys(world.entities).length>300)
      for (const e of Object.values(world.entities)) assert.ok(e.kind==='fish' ? isWater(terrain,e.x,e.z) : isDry(terrain,e.x,e.z,e.radius),`${e.kind} ${e.x},${e.z}`)
    }
  })
  test(`${terrain}: both armies can reach the opposing base without entering water`,()=>{
    setActiveTerrain(terrain)
    for(const sign of [-1,1]) {
      const e=createUnit('march','royalElephant',sign===1?'enemy':'player',sign*55,sign*55)
      const path=terrainRoute(terrain,e.x,e.z,-sign*55,-sign*55)
      assert.ok(path.length)
      let reached=false
      for(let i=0;i<3000&&!reached;i++) {
        reached=moveTowards(e,-sign*55,-sign*55,0.1,[],0.6)
        assert.ok(isDry(terrain,e.x,e.z,e.radius),`water at ${e.x},${e.z}`)
      }
      assert.ok(reached,`stuck at ${e.x},${e.z}`)
    }
  })
  test(`${terrain}: rematch preserves terrain and civilization`,()=>{
    useGameStore.getState().setCivilizations('french','japanese',terrain)
    useGameStore.getState().restart()
    assert.equal(useGameStore.getState().terrain,terrain)
    assert.equal(useGameStore.getState().playerCiv,'french')
    assert.equal(useGameStore.getState().enemyCiv,'japanese')
  })
}
test('river has exactly two dry crossings and cannot be bypassed at map edges',()=>{
  let runs=0,wasDry=false
  for(let z=-79;z<=79;z+=0.25) {
    const dry=!isWater('river',riverCenter(z),z)
    if(dry&&!wasDry)runs++
    wasDry=dry
  }
  assert.equal(runs,2)
  for(const z of CROSSINGS) assert.ok(drySegment('river',-20,z,20,z,1.3))
  useGameStore.getState().setCivilizations('british','indian','river')
  assert.equal(isPlacementValid(riverCenter(0),0,'house'),false)
  for(const z of CROSSINGS) assert.equal(isPlacementValid(riverCenter(z),z,'palisade'),false)
})
test('orders into the central lake stop on the shore; spawned troops are dry',()=>{
  useGameStore.getState().setCivilizations('british','indian','lake')
  const e=createUnit('march','sepoy','player',-45,0)
  let reached=false
  for(let i=0;i<1500&&!reached;i++) reached=moveTowards(e,0,0,0.1,[],0.6)
  assert.ok(reached)
  assert.ok(isDry('lake',e.x,e.z,e.radius))
  assert.equal(isPlacementValid(0,0,'house'),false)
  const shore=createBuilding('shore','barracks','player',-32,0,true)
  const fresh=spawnUnit('royalElephant','player',shore)
  assert.ok(isDry('lake',fresh.x,fresh.z,fresh.radius))
})

test('a mixed formation crosses safely while applying unit separation',()=>{
  setActiveTerrain('river')
  const troops=['royalElephant','sepoy','hussar','heavyCannon'].map((kind,i)=>createUnit(`u${i}`,kind,'player',-22-i*2,-34+i*1.4))
  const arrived=new Set()
  for(let frame=0;frame<1500 && arrived.size<troops.length;frame++) for(let i=0;i<troops.length;i++) {
    const e=troops[i]
    if(arrived.has(e.id))continue
    if(moveTowards(e,20+i*2,-34+i*1.4,0.1,troops,0.6))arrived.add(e.id)
    assert.ok(isDry('river',e.x,e.z,e.radius))
  }
  assert.equal(arrived.size,troops.length)
})
